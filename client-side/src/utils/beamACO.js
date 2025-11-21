class BeamACO {
  constructor(distanceMatrix, durationMatrix) {
    this.distanceMatrix = distanceMatrix;
    this.durationMatrix = durationMatrix;

    // ---- Core parameters ----
    this.CITY_NUM = distanceMatrix.length;
    this.ANT_NUM = Math.max(10, Math.floor(this.CITY_NUM / 2));
    this.ITER = 200;

    // Beam scheduling
    this.BEAM_INITIAL_FACTOR = 0.35;
    this.BEAM_FINAL_FACTOR = 0.10;

    // ACO parameters
    this.ALPHA = 1;
    this.BETA = 3;
    this.CHARLIE = 2;
    this.RHO = 0.5;
    this.Q = 1;

    // Exploration to exploitation switching
    this.EXPLOITATION_THRESHOLD = Math.floor(0.4 * this.ITER);
    this.BOOST = 2.0;

    // Elitist reinforcement
    this.ELITE_WEIGHT = 1.5;

    // Pheromone limits
    this.TAU_MIN = 1e-4;
    this.TAU_MAX = 10;
    this.EPS = 1e-12;

    // ---- Build heuristic matrix ----
    this.heurMatrix = Array.from({ length: this.CITY_NUM }, () =>
      new Array(this.CITY_NUM).fill(0)
    );

    for (let i = 0; i < this.CITY_NUM; i++) {
      for (let j = 0; j < this.CITY_NUM; j++) {
        if (i === j) continue;
        const d = Math.max(distanceMatrix[i][j], this.EPS);
        const t = Math.max(durationMatrix[i][j], this.EPS);
        this.heurMatrix[i][j] =
          (1 / d) ** this.BETA * (1 / t) ** this.CHARLIE;
      }
    }

    // ---- Static neighbors ----
    const M = Math.min(this.CITY_NUM - 1, 50);
    this.staticNeighbors = this.buildStaticNeighbors(this.heurMatrix, M);

    // ---- Pheromone initialization ----
    this.pheromoneMatrix = this.initializePheromoneMatrix(this.CITY_NUM);

    // ---- Ants ----
    this.ants = Array.from(
      { length: this.ANT_NUM },
      () => new this.Ant(this, this.CITY_NUM, this.heurMatrix, this.staticNeighbors)
    );

    // ---- Best tracking ----
    this.bestPath = [];
    this.bestScore = Infinity;
    this.bestDistance = 0;
    this.bestDuration = 0;
    this.bestSolutions = [];
  }

  // ===================================================
  // Helper functions
  // ===================================================
  buildStaticNeighbors(heurMatrix, M) {
    const n = heurMatrix.length;
    const neighbors = Array.from({ length: n }, () => []);

    for (let i = 0; i < n; i++) {
      const arr = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) arr.push({ city: j, heur: heurMatrix[i][j] });
      }
      arr.sort((a, b) => b.heur - a.heur);
      neighbors[i] = arr.slice(0, M).map(x => x.city);
    }

    return neighbors;
  }

  initializePheromoneMatrix(n) {
    // Adaptive tau initial
    let sum = 0, cnt = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = this.distanceMatrix[i][j];
        const t = this.durationMatrix[i][j];
        sum += d + t;
        cnt++;
      }
    }
    const avg = Math.max(sum / cnt, this.EPS);
    const tau0 = 1 / (this.RHO * n * avg);

    return Array.from({ length: n }, () =>
      Array.from({ length: n }, () => tau0)
    );
  }

  getBeamWidth(iter) {
    const b0 = this.BEAM_INITIAL_FACTOR * this.CITY_NUM;
    const b1 = this.BEAM_FINAL_FACTOR * this.CITY_NUM;
    const t = Math.min(iter, this.EXPLOITATION_THRESHOLD) / this.EXPLOITATION_THRESHOLD;
    return Math.max(2, Math.floor(b0 * (1 - t) + b1 * t));
  }

  // ===================================================
  // MinHeap class
  // ===================================================
  MinHeap = class {
    constructor(capacity) {
      this.capacity = capacity;
      this.data = [];
    }
    size() { return this.data.length; }
    _swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]]; }
    _parent(i) { return (i - 1) >> 1; }
    _left(i) { return (i << 1) + 1; }
    _right(i) { return (i << 1) + 2; }
    
    push(item) {
      const a = this.data, cap = this.capacity;
      // Not full → push normally
      if (a.length < cap) {
        a.push(item);
        this._up(a.length - 1);
      }
      // Full → replace worst (root) if new item is better
      else if (item.att > a[0].att) {
        a[0] = item;
        this._down(0);
      }
    }

    _up(i) {
      while (i > 0) {
        const p = this._parent(i);
        if (this.data[i].att < this.data[p].att) {
          this._swap(i, p);
          i = p;
        } else break;
      }
    }

    _down(i) {
      const a = this.data;
      while (true) {
        let smallest = i;
        const l = this._left(i), r = this._right(i);

        if (l < a.length && a[l].att < a[smallest].att) smallest = l;
        if (r < a.length && a[r].att < a[smallest].att) smallest = r;

        if (smallest === i) break;

        this._swap(i, smallest);
        i = smallest;
      }
    }
  };

  // ===================================================
  // Ant class
  // ===================================================
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
      this.visited = Array(this.cityNum).fill(false);
      this.visited[0] = true;
      this.totalDistance = 0;
      this.totalDuration = 0;
      this.moveCount = 1;
      this.cur = 0;
    }

    next(pheromoneMatrix, beamWidth) {
      const heap = new this.parent.MinHeap(beamWidth);
      const seen = new Set();

      // Static neighbors first
      for (const city of this.staticNeighbors[this.cur]) {
        if (this.visited[city]) continue;
          seen.add(city);
          const pher = pheromoneMatrix[this.cur][city] ** this.parent.ALPHA;
          const heur = this.heurMatrix[this.cur][city];
          const att = pher * heur;
        if (att > 0) heap.push({ city, att });
      }

      // Fill beam with any other cities
      if (heap.size() < beamWidth) {
        for (let city = 0; city < this.cityNum; city++) {
          if (city === this.cur || this.visited[city] || seen.has(city)) continue;
            const pher = pheromoneMatrix[this.cur][city] ** this.parent.ALPHA;
            const heur = this.heurMatrix[this.cur][city];
            const att = pher * heur;
          if (att > 0) heap.push({ city, att });
        }
      }

      const beam = heap.data
      .slice()                         
      .sort((a, b) => b.att - a.att);

      if (!beam.length) return;

      // Roulette selection
      const total = beam.reduce((s, x) => s + x.att, 0);
      let r = Math.random() * total;

      let chosen = beam[beam.length - 1].city; 

      for (const item of beam) {
        r -= item.att;
        if (r <= 0) {
          chosen = item.city;
          break;
        }
      }

      // Move
      this.path.push(chosen);
      this.visited[chosen] = true;
      this.totalDistance += this.parent.distanceMatrix[this.cur][chosen];
      this.totalDuration += this.parent.durationMatrix[this.cur][chosen];
      this.cur = chosen;
      this.moveCount++;
    }

    search(pheromoneMatrix, beamWidth) {
      this.clean();
      while (this.moveCount < this.cityNum) {
        this.next(pheromoneMatrix, beamWidth);
      }
      const last = this.path[this.cityNum - 1];
      this.totalDistance += this.parent.distanceMatrix[last][0];
      this.totalDuration += this.parent.durationMatrix[last][0];
    }
  };

  // ===================================================
  // Unified pheromone update
  // ===================================================
  updatePheromoneMatrix(paths, scores, bestIdx, isExploitationPhase) {
    // Evaporation
    for (let i = 0; i < this.CITY_NUM; i++) {
      for (let j = 0; j < this.CITY_NUM; j++) {
        this.pheromoneMatrix[i][j] *= (1 - this.RHO);
      }
    }

    if (!isExploitationPhase) {
      // Exploration: deposit for all ants
      for (let k = 0; k < paths.length; k++) {
        const dep = this.Q / Math.max(scores[k], this.EPS);
        this._depositPath(paths[k], dep);
      }
    } else {
      // Exploitation: only iteration-best ant
      let dep = this.Q / Math.max(scores[bestIdx], this.EPS);
      dep *= this.BOOST;
      this._depositPath(paths[bestIdx], dep);
    }
  }

  // ===================================================
  // Elitist reinforcement
  // ===================================================
  depositElite() {
    if (!this.bestPath.length) return;
    const elite = this.ELITE_WEIGHT * (this.Q / Math.max(this.bestScore, this.EPS));
    this._depositPath(this.bestPath, elite);
  }

  // ===================================================
  // Clamp pheromone
  // ===================================================
  clampPheromone() {
    for (let i = 0; i < this.CITY_NUM; i++) {
      for (let j = 0; j < this.CITY_NUM; j++) {
        this.pheromoneMatrix[i][j] = Math.max(
          this.TAU_MIN,
          Math.min(this.TAU_MAX, this.pheromoneMatrix[i][j])
        );
      }
    }
  }

  // ===================================================
  // Deposit helper
  // ===================================================
  _depositPath(path, dep) {
    for (let k = 0; k < path.length - 1; k++) {
      const u = path[k];
      const v = path[k + 1];
      this.pheromoneMatrix[u][v] += dep;
      this.pheromoneMatrix[v][u] += dep;
    }
    const last = path[path.length - 1];
    this.pheromoneMatrix[last][0] += dep;
    this.pheromoneMatrix[0][last] += dep;
  }

  // ===================================================
  // MAIN LOOP
  // ===================================================
  run() {
    const startTime = performance.now();

    for (let iter = 0; iter < this.ITER; iter++) {

      // Initialize the parameters
      const beamWidth = this.getBeamWidth(iter);
      const paths = [];
      const scores = [];
      const dists = [];
      const durs = [];

      const isExploitationPhase = iter >= this.EXPLOITATION_THRESHOLD;

      // Ants build tours
      for (const ant of this.ants) {
        ant.search(this.pheromoneMatrix, beamWidth);
        
        // Compute the metrics
        const dist = ant.totalDistance;
        const dur = ant.totalDuration;
        const score = dist + dur;

        // Store iteration results
        paths.push(ant.path.slice());
        scores.push(score);
        dists.push(dist);
        durs.push(dur);

        // Update global best
        if (score < this.bestScore) {
          this.bestScore = score;
          this.bestPath = ant.path.slice();
          this.bestDistance = dist;
          this.bestDuration = dur;
        }
      }

      // Track convergence
      this.bestSolutions.push({
        iteration: iter,
        bestDistance: this.bestDistance,
        bestDuration: this.bestDuration
      });

      const bestIdx = scores.indexOf(Math.min(...scores));

      // 1) Main global update
      this.updatePheromoneMatrix(paths, scores, bestIdx, isExploitationPhase);

      // 2) Elitist reinforcement
      this.depositElite();

      // 3) Clamp pheromone
      this.clampPheromone();
    }

    const endTime = performance.now();

    return {
      bestPath: this.bestPath,
      bestPathLength: this.bestDistance,
      bestPathDuration: this.bestDuration,
      computationTime: endTime - startTime,
      bestSolutions: this.bestSolutions
    };
  }
}

// Export wrapper
export function beamAcoAlgorithm(distanceMatrix, durationMatrix) {
  const aco = new BeamACO(distanceMatrix, durationMatrix);
  return aco.run();
}