// ===============================
// OOP Beam-ACO
// ===============================
class BeamACO {
  constructor(distanceMatrix, durationMatrix) {
    this.distanceMatrix = distanceMatrix;
    this.durationMatrix = durationMatrix;

    // ---- Parameters  ----
    this.ITER = 200;
    this.EXPLOITATION_THRESHOLD = 50;

    this.BEAM_INITIAL_FACTOR = 0.5;
    this.BEAM_FINAL_FACTOR   = 0.125;

    this.BOOST = 2.5;       // boost for iteration-best paths
    this.ELITE_WEIGHT = 2;  // extra global-best reinforcement each iter

    this.ALPHA = 1;   // pheromone influence
    this.RHO   = 0.5; // global evaporation rate
    this.Q     = 1;   // pheromone deposit constant
    this.GAMMA = 3;   // distance attractiveness
    this.DELTA = 2;   // duration attractiveness

    // local evaporation rate
    this.LOCAL_RHO = 0.1;

    // pheromone clamping
    this.TAU_MIN = 1e-6;
    this.TAU_MAX = 10;

    // numerical safety
    this.EPS = 1e-12;

    // ---- Derived parameters ----
    this.CITY_NUM = distanceMatrix.length;

    // ---- Precompute heuristic matrix ----
    this.heurMatrix = Array.from({ length: this.CITY_NUM }, () => new Array(this.CITY_NUM));
    for (let i = 0; i < this.CITY_NUM; i++) {
      for (let j = 0; j < this.CITY_NUM; j++) {
        if (i === j) { this.heurMatrix[i][j] = 0; continue; }
        const d = Math.max(this.distanceMatrix[i][j], this.EPS);
        const t = Math.max(this.durationMatrix[i][j], this.EPS);
        const distH = (1 / d) ** this.GAMMA;
        const timeH = (1 / t) ** this.DELTA;
        this.heurMatrix[i][j] = distH * timeH;
      }
    }

    // ---- Build static neighbor lists (top M by heuristic) ----
    const M = Math.min(this.CITY_NUM - 1, 50);
    this.staticNeighbors = this.buildStaticNeighbors(this.heurMatrix, M);

    // ---- Pheromone ----
    this.pheromoneMatrix = this.initializePheromoneMatrix(this.CITY_NUM);

    // ---- Ants ----
    this.ANT_NUM = Math.max(10, Math.floor(this.CITY_NUM / 2));
    this.ants = Array.from(
      { length: this.ANT_NUM },
      () => new this.Ant(this, this.CITY_NUM, this.heurMatrix, this.staticNeighbors)
    );

    // ---- Objective normalization (critical if units differ) ----
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
  // MinHeap for top-K selection
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
    // deterministic tau0 helps stability; diagonal zero
    const tau0 = 0.2;
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
      this.path = [0];
      this.visited = new Array(this.cityNum).fill(false);
      this.visited[0] = true;
      this.totalDistance = 0;
      this.totalDuration = 0;
      this.moveCount = 1;
      this.cur = 0;
    }

    next(distMatrix, durationMatrix, pheromoneMatrix, beamWidth) {
      const heap = new this.parent.MinHeap(beamWidth);
      const seenStatic = new Set();

      // Scan top-M heuristic neighbors
      for (let city of this.staticNeighbors[this.cur]) {
        if (!this.visited[city]) {
          seenStatic.add(city);
          const pher = Math.pow(pheromoneMatrix[this.cur][city], this.parent.ALPHA);
          const heur = this.heurMatrix[this.cur][city];
          const att = pher * heur;
          if (att > 0) heap.push({ city, attractiveness: att });
        }
      }

      // Fallback: scan all others if needed
      if (heap.size() < beamWidth) {
        for (let city = 0; city < this.cityNum; city++) {
          if (city === this.cur || seenStatic.has(city) || this.visited[city]) continue;
          const pher = Math.pow(pheromoneMatrix[this.cur][city], this.parent.ALPHA);
          const heur = this.heurMatrix[this.cur][city];
          const att = pher * heur;
          if (att > 0) heap.push({ city, attractiveness: att });
        }
      }

      // Roulette-wheel within beam (with degenerate fallback)
      const beam = heap.data;
      const beamTotal = beam.reduce((sum, item) => sum + item.attractiveness, 0);

      let chosen = -1;
      if (beam.length && isFinite(beamTotal) && beamTotal > 0) {
        let threshold = Math.random() * beamTotal;
        for (let { city, attractiveness } of beam) {
          threshold -= attractiveness;
          if (threshold <= 0) { chosen = city; break; }
        }
        if (chosen === -1) chosen = beam[beam.length - 1].city; // numeric safety
      } else {
        // Greedy heuristic fallback
        let bestCity = -1, bestScore = -Infinity;
        for (let city = 0; city < this.cityNum; city++) {
          if (city === this.cur || this.visited[city]) continue;
          const s = this.heurMatrix[this.cur][city];
          if (s > bestScore) { bestScore = s; bestCity = city; }
        }
        if (bestCity === -1) return; // defensive
        chosen = bestCity;
      }

      // Local evaporation (gentler than global)
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
      // complete tour
      this.totalDistance += distMatrix[this.cur][this.path[0]];
      this.totalDuration += durationMatrix[this.cur][this.path[0]];
    }
  };

  // -------------------------
  // Utility: score normalization
  // -------------------------
  scoreOf(dist, dur) {
    // normalized weighted sum; aligns scales so Beam ≈ Classic preference
    return (dist / this.S_DIST) + (dur / this.S_DUR);
  }

  // -------------------------
  // Main loop
  // -------------------------
  run() {
    // Use performance.now() in browser; Node: import from 'node:perf_hooks'
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    for (let iter = 0; iter < this.ITER; iter++) {
      const beamWidth = this.getBeamWidth(iter);

      const iterationPaths  = [];
      const iterationScores = [];
      const iterationDists  = [];
      const iterationDurs   = [];

      // Phases (kept for readability; beamWidth already tightens)
      const isExploitationPhase = iter >= this.ITER * 0.3;

      // --- Construct solutions
      for (let ant of this.ants) {
        ant.search(this.distanceMatrix, this.durationMatrix, this.pheromoneMatrix, beamWidth);

        const dist = ant.totalDistance;
        const dur  = ant.totalDuration;
        const score = this.scoreOf(dist, dur);

        iterationPaths.push(ant.path.slice());
        iterationScores.push(score);
        iterationDists.push(dist);
        iterationDurs.push(dur);

        if (score < this.bestScore) {
          this.bestScore   = score;
          this.bestPath    = ant.path.slice();
          this.bestDistance = dist;
          this.bestDuration = dur;
        }
      }

      this.bestSolutions.push({
        iteration: iter,
        bestDistance: this.bestDistance,
        bestDuration: this.bestDuration
      });

      // --- Global evaporation (deterministic)
      for (let i = 0; i < this.CITY_NUM; i++) {
        for (let j = 0; j < this.CITY_NUM; j++) {
          this.pheromoneMatrix[i][j] *= (1 - this.RHO);
        }
      }

      // --- Deposition for iteration paths
      // Use normalized score (lower is better)
      // Also add boost to the *iteration-best* (epsilon compare)
      let bestIterIdx = 0;
      for (let i = 1; i < iterationScores.length; i++) {
        if (iterationScores[i] < iterationScores[bestIterIdx]) bestIterIdx = i;
      }

      for (let i = 0; i < iterationPaths.length; i++) {
        let deposit = this.Q / Math.max(iterationScores[i], this.EPS);
        if (isExploitationPhase && i === bestIterIdx) deposit *= this.BOOST;

        const path = iterationPaths[i];
        for (let k = 0; k < path.length - 1; k++) {
          const u = path[k], v = path[k + 1];
          this.pheromoneMatrix[u][v] += deposit;
          this.pheromoneMatrix[v][u] += deposit;
        }
        // close the loop
        const last = path[path.length - 1], first = path[0];
        this.pheromoneMatrix[last][first] += deposit;
        this.pheromoneMatrix[first][last] += deposit;
      }

      // --- Elitist reinforcement of global best path
      if (this.bestPath.length) {
        const eliteDeposit = this.ELITE_WEIGHT * (this.Q / Math.max(this.bestScore, this.EPS));
        for (let k = 0; k < this.bestPath.length - 1; k++) {
          const u = this.bestPath[k], v = this.bestPath[k + 1];
          this.pheromoneMatrix[u][v] += eliteDeposit;
          this.pheromoneMatrix[v][u] += eliteDeposit;
        }
        const last = this.bestPath[this.bestPath.length - 1], first = this.bestPath[0];
        this.pheromoneMatrix[last][first] += eliteDeposit;
        this.pheromoneMatrix[first][last] += eliteDeposit;
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
// Public API (unchanged)
// -------------------------
export function beamAcoAlgorithm(distanceMatrix, durationMatrix) {
  // Basic input checks
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