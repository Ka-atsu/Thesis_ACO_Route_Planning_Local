const ITER = 200;
const EXPLOITATION_THRESHOLD = 50;  // You can adjust the percentage (50%-70%) for when exploitation starts

const BEAM_INITIAL_FACTOR = 0.5;
const BEAM_FINAL_FACTOR   = 0.125;

const BOOST = 2.5;

const ALPHA = 1;
const RHO   = 0.5;
const Q     = 1;
const GAMMA = 3;
const DELTA = 2;

// MinHeap for top-K selection
class MinHeap {
  constructor(capacity) {
    this.capacity = capacity;
    this.data = [];
  }
  size() { return this.data.length; }
  peek() { return this.data[0]; }
  push(item) {
    if (this.data.length < this.capacity) {
      this.data.push(item);
      this._siftUp(this.data.length - 1);
    } else if (item.attractiveness > this.data[0].attractiveness) {
      this.data[0] = item;
      this._siftDown(0);
    }
  }
  _swap(i, j) { [this.data[i], this.data[j]] = [this.data[j], this.data[i]]; }
  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i) { return 2 * i + 1; }
  _right(i) { return 2 * i + 2; }
  _siftUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.data[i].attractiveness < this.data[p].attractiveness) {
        this._swap(i, p);
        i = p;
      } else break;
    }
  }
  _siftDown(i) {
    const n = this.data.length;
    let smallest = i;
    const l = this._left(i), r = this._right(i);
    if (l < n && this.data[l].attractiveness < this.data[smallest].attractiveness) smallest = l;
    if (r < n && this.data[r].attractiveness < this.data[smallest].attractiveness) smallest = r;
    if (smallest !== i) {
      this._swap(i, smallest);
      this._siftDown(smallest);
    }
  }
}

// Build static neighbor lists based on heuristic
function buildStaticNeighbors(heurMatrix, M) {
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

// Initialize pheromone matrix with constant value
function initializePheromoneMatrix(numCities) {
  return Array.from({ length: numCities }, () =>
    new Array(numCities).fill(0.200)
  );
}

// Compute beam width that shrinks from BEAM_INITIAL_FACTOR to BEAM_FINAL_FACTOR
function getBeamWidth(iter, cityNum) {
  const b0 = BEAM_INITIAL_FACTOR * cityNum;
  const b1 = BEAM_FINAL_FACTOR   * cityNum;
  const t  = Math.min(iter, EXPLOITATION_THRESHOLD) / EXPLOITATION_THRESHOLD;
  return Math.max(2, Math.floor(b0 * (1 - t) + b1 * t));
}

// Ant class with optimized beam‐search step
class Ant {
  constructor(cityNum, heurMatrix, staticNeighbors) {
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
    const heap = new MinHeap(beamWidth);
    const seenStatic = new Set();

    // Scan top-M heuristic neighbors
    for (let city of this.staticNeighbors[this.cur]) {
      if (!this.visited[city]) {
        seenStatic.add(city);
        const pher = Math.pow(pheromoneMatrix[this.cur][city], ALPHA);
        const heur = this.heurMatrix[this.cur][city];
        heap.push({ city, attractiveness: pher * heur });
      }
    }

    // If not enough, fall back to scanning all others
    if (heap.size() < beamWidth) {
      for (let city = 0; city < this.cityNum; city++) {
        if (city === this.cur || seenStatic.has(city) || this.visited[city]) continue;
        const pher = Math.pow(pheromoneMatrix[this.cur][city], ALPHA);
        const heur = this.heurMatrix[this.cur][city];
        heap.push({ city, attractiveness: pher * heur });
      }
    }

    // Extract beam candidates
    const beam = heap.data;
    let beamTotal = beam.reduce((sum, item) => sum + item.attractiveness, 0);

    // Roulette-wheel selection within beam
    let threshold = Math.random() * beamTotal;
    for (let { city, attractiveness } of beam) {
      threshold -= attractiveness;
      if (threshold <= 0) {
        // local evaporation
        pheromoneMatrix[this.cur][city] *= (1 - RHO);
        // move to city
        this.path.push(city);
        this.visited[city] = true;
        this.totalDistance += distMatrix[this.cur][city];
        this.totalDuration += durationMatrix[this.cur][city];
        this.cur = city;
        this.moveCount++;
        break;
      }
    }
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
}

// Main ACO with beam & boost and fully precomputed heuristics
export function beamAcoAlgorithm(distanceMatrix, durationMatrix) {
  if (!Array.isArray(distanceMatrix) || !distanceMatrix.every(r => Array.isArray(r))) {
    console.error("Invalid distance matrix");
    return { bestPath: [], bestPathLength: 0, bestPathDuration: 0 };
  }
  if (!Array.isArray(durationMatrix) || !durationMatrix.every(r => Array.isArray(r))) {
    console.error("Invalid duration matrix");
    return { bestPath: [], bestPathLength: 0, bestPathDuration: 0 };
  }

  const CITY_NUM = distanceMatrix.length;

  // Precompute heuristic matrix
  const heurMatrix = Array.from({ length: CITY_NUM }, () => new Array(CITY_NUM));
  for (let i = 0; i < CITY_NUM; i++) {
    for (let j = 0; j < CITY_NUM; j++) {
      const distH = (1 / distanceMatrix[i][j]) ** GAMMA;
      const timeH = (1 / durationMatrix[i][j]) ** DELTA;
      heurMatrix[i][j] = distH * timeH;
    }
  }

  // Build static neighbor lists (top M by heuristic)
  const M = Math.min(CITY_NUM - 1, 50);
  const staticNeighbors = buildStaticNeighbors(heurMatrix, M);

  const ANT_NUM  = Math.max(10, Math.floor(CITY_NUM / 2));
  const ants     = Array.from(
    { length: ANT_NUM },
    () => new Ant(CITY_NUM, heurMatrix, staticNeighbors)
  );
  let pheromoneMatrix = initializePheromoneMatrix(CITY_NUM);

  let bestPath = [];
  let bestScore = Infinity;
  let bestDistance = 0;
  let bestDuration = 0;

  const startTime = performance.now();

  // Array to track the best solution at each iteration for plotting
  const bestSolutions = [];

  for (let iter = 0; iter < ITER; iter++) {
    const beamWidth   = getBeamWidth(iter, CITY_NUM);

    const iterationPaths  = [];
    const iterationScores = [];

    // Determine the phase
    let isExplorationPhase = iter < ITER * 0.3;  // Exploration phase: 0-30% of iterations
    let isExploitationPhase = iter >= ITER * 0.3;  // Exploitation phase: 30%-100% of iterations


    for (let ant of ants) {
      if (isExplorationPhase) {
        // Exploration phase: No pheromone updates, focus on exploring diverse paths
        ant.search(distanceMatrix, durationMatrix, pheromoneMatrix, beamWidth);
      } else if (isExploitationPhase) {
        // Exploitation phase: Apply pheromone updates and smaller beam width
        ant.search(distanceMatrix, durationMatrix, pheromoneMatrix, beamWidth);
      }

      const dist = ant.totalDistance;
      const dur = ant.totalDuration;
      const score = dist + dur;

      iterationPaths.push(ant.path.slice());
      iterationScores.push(score);

      if (score < bestScore) {
        bestScore = score;
        bestPath = ant.path.slice();
        bestDistance = dist;
        bestDuration = dur;
      }
    }

    bestSolutions.push({ iteration: iter, bestDistance: bestDistance, bestDuration: bestDuration });

    // Perform global pheromone evaporation
    for (let i = 0; i < CITY_NUM; i++) {
      for (let j = 0; j < CITY_NUM; j++) {
        pheromoneMatrix[i][j] *= (1 - RHO);
      }
    }

    // Apply pheromone deposition (start boosting after 50% of iterations)
    for (let i = 0; i < iterationPaths.length; i++) {
      let deposit = Q / iterationScores[i];

      if (isExploitationPhase && iterationScores[i] === bestScore) {
        // Apply strong pheromone updates in the exploitation phase
        deposit *= BOOST;
      }

      const path = iterationPaths[i];
      for (let k = 0; k < path.length - 1; k++) {
        const u = path[k], v = path[k + 1];
        pheromoneMatrix[u][v] += deposit;
        pheromoneMatrix[v][u] += deposit;
      }
    }
  }

  const endTime = performance.now();

  // Return the best solution found after all iterations, including convergence and timing data
  return {
    bestPath,
    bestPathLength:   bestDistance,
    bestPathDuration: bestDuration,
    computationTime:  endTime - startTime,
    bestSolutions,   
  };
}