class BeamACO {
  constructor(distanceMatrix, durationMatrix) {
    this.distanceMatrix = distanceMatrix;
    this.durationMatrix = durationMatrix;

    // ---- Core parameters ----
    this.ITER = 200;
    this.EXPLOITATION_THRESHOLD = 70;

    this.BEAM_INITIAL_FACTOR = 0.35;
    this.BEAM_FINAL_FACTOR   = 0.10;

    this.BOOST = 2.0;      // boost for iteration-best paths
    this.ELITE_WEIGHT = 1.5;      // extra global-best reinforcement each iter

    this.ALPHA = 1;          // pheromone influence
    this.RHO   = 0.5;        // global evaporation rate
    this.Q     = 1;          // pheromone deposit constant

    // Distance/Duration heuristic exponents
    this.BETA = 3;          // distance attractiveness exponent
    this.CHARLIE = 2;          // duration attractiveness exponent

    // Local evaporation
    this.LOCAL_RHO = 0.12;

    // MATLAB-aligned toggles
    this.Q0 = 0.2;              // probability of greedy pick within beam
    this.USE_BEST_ONLY = true;  // deposit only iteration-best

    // Pheromone clamping
    this.TAU_MIN = 1e-6;
    this.TAU_MAX = 10;
    this.TAU0_AUTO = true; // adaptive tau0

    // Numerical safety
    this.EPS = 1e-12;

    // ---- Derived ----
    this.CITY_NUM = distanceMatrix.length;

    // ---- Precompute heuristic matrix (distance & duration) ----
    this.heurMatrix = Array.from({ length: this.CITY_NUM }, () => new Array(this.CITY_NUM));
    for (let i = 0; i < this.CITY_NUM; i++) {
      for (let j = 0; j < this.CITY_NUM; j++) {
        if (i === j) { this.heurMatrix[i][j] = 0; continue; }
        const d = Math.max(this.distanceMatrix[i][j], this.EPS);
        const t = Math.max(this.durationMatrix[i][j], this.EPS);
        const distH = (1 / d) ** this.BETA;
        const timeH = (1 / t) ** this.CHARLIE;
        this.heurMatrix[i][j] = distH * timeH;
      }
    }

    // ---- Static candidate lists (top M by heuristic) ----
    const M = Math.min(this.CITY_NUM - 1, 50);
    this.staticNeighbors = this.buildStaticNeighbors(this.heurMatrix, M);

    // ---- Pheromone ----
    this.pheromoneMatrix = this.initializePheromoneMatrix(this.CITY_NUM);

    // ---- Ants ----
    this.ANT_NUM = this.CITY_NUM;
    this.ants = Array.from(
      { length: this.ANT_NUM },
      () => new this.Ant(this, this.CITY_NUM, this.heurMatrix, this.staticNeighbors)
    );

    // ---- Objective scale normalization ----
    const avgOffDiag = (mat) => {
      let sum = 0, cnt = 0;
      for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat.length; j++) {
          if (i === j) continue;
          sum += mat[i][j];
          cnt++;
        }
      }
      return Math.max(sum / Math.max(cnt, 1), this.EPS);
    };
    this.S_DIST = avgOffDiag(this.distanceMatrix);
    this.S_DUR  = avgOffDiag(this.durationMatrix);

    // ---- Tracking best ----
    this.bestPath = [];
    this.bestScore = Infinity;
    this.bestDistance = 0;
    this.bestDuration = 0;
    this.bestSolutions = [];
  }

  // -------------------------
  // MinHeap for top-K beam
  // -------------------------
  MinHeap = class {
    constructor(capacity) {
      this.capacity = capacity;
      this.data = [];
    }
    size() { return this.data.length; }
    push(item) {
      const a = this.data, cap = this.capacity;
      if (a.length < cap) {
        a.push(item); this._up(a.length - 1);
      } else if (item.attractiveness > a[0].attractiveness) {
        a[0] = item; this._down(0);
      }
    }
    _swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]]; }
    _parent(i) { return (i - 1) >> 1; }
    _left(i) { return (i << 1) + 1; }
    _right(i) { return (i << 1) + 2; }
    _up(i) {
      while (i > 0) {
        const p = this._parent(i);
        if (this.data[i].attractiveness < this.data[p].attractiveness) {
          this._swap(i, p); i = p;
        } else break;
      }
    }
    _down(i) {
      const n = this.data.length;
      while (true) {
        let s = i, l = this._left(i), r = this._right(i);
        if (l < n && this.data[l].attractiveness < this.data[s].attractiveness) s = l;
        if (r < n && this.data[r].attractiveness < this.data[s].attractiveness) s = r;
        if (s === i) break;
        this._swap(i, s); i = s;
      }
    }
  };

  // -------------------------
  // Helpers
  // -------------------------
  buildStaticNeighbors(heurMatrix, M) {
    const n = heurMatrix.length;
    const staticNeighbors = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) {
      const arr = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) arr.push({ city: j, heur: heurMatrix[i][j] });
      }
      arr.sort((a, b) => b.heur - a.heur);
      staticNeighbors[i] = arr.slice(0, M).map(x => x.city);
    }
    return staticNeighbors;
  }

  initializePheromoneMatrix(numCities) {
    // Adaptive tau0 like MATLAB Tau0Auto
    const n = numCities;
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue; sum += this.distanceMatrix[i][j]; cnt++;
    }
    const meanD = Math.max(sum / Math.max(cnt, 1), this.EPS);
    const tau0 = this.TAU0_AUTO ? (1 / Math.max(this.RHO * n * meanD, this.EPS)) : 0.2;

    const matrix = Array.from({ length: numCities }, () => Array(numCities).fill(tau0));
    for (let i = 0; i < numCities; i++) matrix[i][i] = 0;
    return matrix;
  }

  getBeamWidth(iter) {
    const b0 = this.BEAM_INITIAL_FACTOR * this.CITY_NUM;
    const b1 = this.BEAM_FINAL_FACTOR   * this.CITY_NUM;
    const t  = Math.min(iter, this.EXPLOITATION_THRESHOLD) / this.EXPLOITATION_THRESHOLD;
    return Math.max(2, Math.floor(b0 * (1 - t) + b1 * t));
  }

  // -------------------------
  // Ant
  // -------------------------
  Ant = class {
    constructor(parent, cityNum, heurMatrix, staticNeighbors) {
      this.parent = parent;
      this.cityNum = cityNum;
      this.heurMatrix = heurMatrix;
      this.staticNeighbors = staticNeighbors;
      this.clean();
    }

    clean() {
      const start = 0;
      this.path = [start];
      this.visited = new Array(this.cityNum).fill(false);
      this.visited[start] = true;
      this.totalDistance = 0;
      this.totalDuration = 0;
      this.moveCount = 1;
      this.cur = start;
    }

    next(distMatrix, durationMatrix, pheromoneMatrix, beamWidth) {
      const heap = new this.parent.MinHeap(beamWidth);
      const seenStatic = new Set();

      // Static neighbors
      for (let city of this.staticNeighbors[this.cur]) {
        if (!this.visited[city]) {
          seenStatic.add(city);
          const pher = Math.pow(pheromoneMatrix[this.cur][city], this.parent.ALPHA);
          const heur = this.heurMatrix[this.cur][city];
          const att = pher * heur;
          if (att > 0) heap.push({ city, attractiveness: att });
        }
      }

      // Add others if needed
      if (heap.size() < beamWidth) {
        for (let city = 0; city < this.cityNum; city++) {
          if (city === this.cur || seenStatic.has(city) || this.visited[city]) continue;
          const pher = Math.pow(pheromoneMatrix[this.cur][city], this.parent.ALPHA);
          const heur = this.heurMatrix[this.cur][city];
          const att = pher * heur;
          if (att > 0) heap.push({ city, attractiveness: att });
        }
      }

      const beam = heap.data;
      if (!beam.length) return;

     // --- pure roulette selection inside the beam
    let chosen = -1;
    const beamTotal = beam.reduce((s, it) => s + it.attractiveness, 0);
    if (isFinite(beamTotal) && beamTotal > 0) {
      let threshold = Math.random() * beamTotal;
      for (let { city, attractiveness } of beam) {
        threshold -= attractiveness;
        if (threshold <= 0) { chosen = city; break; }
      }
      if (chosen === -1) chosen = beam[beam.length - 1].city;
    } else {
      // Greedy fallback if all attractiveness are 0
      let bestCity = -1, bestScore = -Infinity;
      for (let city = 0; city < this.cityNum; city++) {
        if (city === this.cur || this.visited[city]) continue;
        const s = this.heurMatrix[this.cur][city];
        if (s > bestScore) { bestScore = s; bestCity = city; }
      }
      if (bestCity === -1) return;
      chosen = bestCity;
    }

      // Local evaporation (symmetric)
      pheromoneMatrix[this.cur][chosen] *= (1 - this.parent.LOCAL_RHO);
      pheromoneMatrix[chosen][this.cur] *= (1 - this.parent.LOCAL_RHO);

      // Move
      this.path.push(chosen);
      this.visited[chosen] = true;
      this.totalDistance += distMatrix[this.cur][chosen];
      this.totalDuration += durationMatrix[this.cur][chosen];
      this.cur = chosen;
      this.moveCount++;
    }

    search(distMatrix, durationMatrix, pheromoneMatrix, beamWidth) {
      this.clean();
      while (this.moveCount < this.cityNum) {
        this.next(distMatrix, durationMatrix, pheromoneMatrix, beamWidth);
      }
      // close tour
      this.totalDistance += distMatrix[this.cur][this.path[0]];
      this.totalDuration += durationMatrix[this.cur][this.path[0]];
    }
  };

  // -------------------------
  // Utility: score normalization
  // -------------------------
  scoreOf(dist, dur) {
    // normalized weighted sum (weights 1,1; adjust if desired)
    return (dist / this.S_DIST) + (dur / this.S_DUR);
  }

  // deposit helper
  _depositPath(path, deposit) {
    for (let k = 0; k < path.length - 1; k++) {
      const u = path[k], v = path[k + 1];
      this.pheromoneMatrix[u][v] += deposit;
      this.pheromoneMatrix[v][u] += deposit;
    }
    const last = path[path.length - 1], first = path[0];
    this.pheromoneMatrix[last][first] += deposit;
    this.pheromoneMatrix[first][last] += deposit;
  }

  // -------------------------
  // Main loop (fixed iterations; no time limit)
  // -------------------------
  run() {
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    for (let iter = 0; iter < this.ITER; iter++) {
      const beamWidth = this.getBeamWidth(iter);

      const iterationPaths  = [];
      const iterationScores = [];
      const iterationDists  = [];
      const iterationDurs   = [];

      const isExploitationPhase = iter >= Math.floor(0.3 * this.ITER);

      // --- Construct solutions
      for (let ant of this.ants) {
        ant.search(this.distanceMatrix, this.durationMatrix, this.pheromoneMatrix, beamWidth);

        const dist  = ant.totalDistance;
        const dur   = ant.totalDuration;
        const score = this.scoreOf(dist, dur);

        iterationPaths.push(ant.path.slice());
        iterationScores.push(score);
        iterationDists.push(dist);
        iterationDurs.push(dur);

        if (score < this.bestScore) {
          this.bestScore    = score;
          this.bestPath     = ant.path.slice();
          this.bestDistance = dist;
          this.bestDuration = dur;
        }
      }

      this.bestSolutions.push({
        iteration: iter,
        bestDistance: this.bestDistance,
        bestDuration: this.bestDuration
      });

      // --- Global evaporation
      for (let i = 0; i < this.CITY_NUM; i++) {
        for (let j = 0; j < this.CITY_NUM; j++) {
          this.pheromoneMatrix[i][j] *= (1 - this.RHO);
        }
      }

      // --- Deposition (MATLAB-like: iteration-best only, optional boost)
      let bestIterIdx = 0;
      for (let i = 1; i < iterationScores.length; i++) {
        if (iterationScores[i] < iterationScores[bestIterIdx]) bestIterIdx = i;
      }

      if (this.USE_BEST_ONLY) {
        let deposit = this.Q / Math.max(iterationScores[bestIterIdx], this.EPS);
        if (isExploitationPhase) deposit *= this.BOOST;
        this._depositPath(iterationPaths[bestIterIdx], deposit);
      } else {
        for (let i = 0; i < iterationPaths.length; i++) {
          let deposit = this.Q / Math.max(iterationScores[i], this.EPS);
          if (isExploitationPhase && i === bestIterIdx) deposit *= this.BOOST;
          this._depositPath(iterationPaths[i], deposit);
        }
      }

      // --- Elitist reinforcement of global best
      if (this.bestPath.length) {
        const eliteDeposit = this.ELITE_WEIGHT * (this.Q / Math.max(this.bestScore, this.EPS));
        this._depositPath(this.bestPath, eliteDeposit);
      }

      // --- Clamp pheromones
      for (let i = 0; i < this.CITY_NUM; i++) {
        for (let j = 0; j < this.CITY_NUM; j++) {
          const v = this.pheromoneMatrix[i][j];
          this.pheromoneMatrix[i][j] = Math.min(this.TAU_MAX, Math.max(this.TAU_MIN, v));
        }
      }
    }

    const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    return {
      bestPath: this.bestPath,
      bestPathLength:   this.bestDistance,
      bestPathDuration: this.bestDuration,
      computationTime:  endTime - startTime,
      bestSolutions:    this.bestSolutions,
    };
  }
}

// -------------------------
// Public API
// -------------------------
export function beamAcoAlgorithm(distanceMatrix, durationMatrix) {
  if (!Array.isArray(distanceMatrix) || !distanceMatrix.every(r => Array.isArray(r))) {
    console.error("Invalid distance matrix");
    return { bestPath: [], bestPathLength: 0, bestPathDuration: 0 };
  }
  if (!Array.isArray(durationMatrix) || !durationMatrix.every(r => Array.isArray(r))) {
    console.error("Invalid duration matrix");
    return { bestPath: [], bestPathLength: 0, bestPathDuration: 0 };
  }
  if (distanceMatrix.length !== durationMatrix.length) {
    console.error("Mismatched matrix sizes");
    return { bestPath: [], bestPathLength: 0, bestPathDuration: 0 };
  }

  const aco = new BeamACO(distanceMatrix, durationMatrix);
  return aco.run();
}