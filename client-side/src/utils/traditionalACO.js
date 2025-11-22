class ACO {
  constructor(distanceMatrix, durationMatrix) {
    this.distanceMatrix = distanceMatrix;
    this.durationMatrix = durationMatrix;

    // ---- Core algorithm parameters ----
    this.CITY_NUM = distanceMatrix.length;                      // number of cities
    this.ANT_NUM = Math.max(10, Math.floor(this.CITY_NUM / 2)); // number of ants
    this.ITER = 200;                                            // number of iterations
    
    // Pheromone settings
    this.INITIAL_PHEROMONE = 0.200;                             // initial pheromone influence
    this.ALPHA = 1;                                             // pheromone influence
    this.RHO = 0.5;                                             // pheromone evaporation rate
    this.Q = 1;                                                 // pheromone deposit constant

    // Heuristic exponents (how strongly we care about distance vs duration)
    this.BETA = 3;                                             // distance attractiveness
    this.CHARLIE = 2;                                          // duration attractiveness

    // ---- State ----
    this.pheromoneMatrix = this.initializePheromoneMatrix(this.CITY_NUM); // pheromone levels
    this.bestPath = null;                                                 // best path found so far
    this.bestPathLength = Infinity;                                       // best distance found so far
    this.bestPathDuration = Infinity;                                     // best duration found so far
    this.bestSolutions = [];                                              // track progress across iterations
    this.bestScore = Infinity;
  }

  // -------------------------
  // Initialize pheromone matrix with a constant value
  // -------------------------
  initializePheromoneMatrix(numCities) {
    return Array.from({ length: numCities }, () =>
      new Array(numCities).fill(this.INITIAL_PHEROMONE)
    );
  }

  // -------------------------
  // Global pheromone update:
  //   1) Evaporation on all edges
  //   2) Deposit pheromone along ants' paths
  //
  // allPaths:    array of paths (each path is an array of city indices)
  // allPathLengths: array of distances corresponding to each path
  // -------------------------
  updatePheromoneMatrix(pheromoneMatrix, allPaths, allPathLengths, pheromoneDecay, pheromoneConstant) {
    // Evaporation (reduce pheromone on ALL edges)
    for (let i = 0; i < pheromoneMatrix.length; i++) {
      // Reduce pheromone by a decay factor
      for (let j = 0; j < pheromoneMatrix[i].length; j++) {
        pheromoneMatrix[i][j] *= (1 - pheromoneDecay);
      }
    }

    // Deposit (add pheromone proportional to path quality)
    for (let i = 0; i < allPaths.length; i++) {
      const path = allPaths[i];
      // Smaller path length → larger deposit (better solution)
      // Random term slightly perturbs deposit so paths are not reinforced identically.
      const pheromoneDeposit = pheromoneConstant / (allPathLengths[i] * (Math.random() * 0.5 + 1));
      // Add pheromone along each edge of the path
      for (let j = 0; j < path.length - 1; j++) {
        pheromoneMatrix[path[j]][path[j + 1]] += pheromoneDeposit;
        pheromoneMatrix[path[j + 1]][path[j]] += pheromoneDeposit; // ensure symmetry
      }
    }
    return pheromoneMatrix;
  }

  // -------------------------
  // Ant class (inner class of ACO)
  // Each ant builds a full tour based on:
  //   - pheromoneMatrix (learned "experience")
  //   - distance and duration heuristics
  // -------------------------
  Ant = class {
    constructor(parent, cityNum) {
      this.parent = parent;    // reference back to ACO instance
      this.cityNum = cityNum;  // number of cities in this ACO instance
      this.clean();            // initialize internal state
    }

    // Reset ant state
    clean() {
      this.path = [0];                                      // start at city 0
      this.visited = new Array(this.cityNum).fill(false);   // visited cities
      this.visited[0] = true;                               // mark start as visited
      this.totalDistance = 0;                               // total distance and duration
      this.totalDuration = 0;                               // total distance and duration
      this.moveCount = 1;                                   // start with one move (at city 0)                 
      this.cur = 0;                                         // current city index
    }

    // Choose the next city using probabilistic (roulette wheel) selection
    // based on pheromones and heuristic desirability.
    next() {
      const distMatrix = this.parent.distanceMatrix;
      const durationMatrix = this.parent.durationMatrix;
      const pheromoneMatrix = this.parent.pheromoneMatrix;

      const ALPHA = this.parent.ALPHA;
      const BETA = this.parent.BETA;       
      const CHARLIE = this.parent.CHARLIE;               
      const RHO = this.parent.RHO;

      let probabilities = new Array(this.cityNum).fill(0);   // probabilities for each city
      let totalProb = 0;                                     // sum of attractiveness (for normalization)

      // Calculate attractiveness for each unvisited city
      for (let city = 0; city < this.cityNum; city++) {
        // Only consider unvisited cities
        if (!this.visited[city]) {
          const pheromone = Math.pow(pheromoneMatrix[this.cur][city], ALPHA);                 // pheromone level raised to alpha
          const attractivenessDistance = Math.pow(1 / distMatrix[this.cur][city], BETA);      // distance attractiveness raised to beta
          const attractivenessTime = Math.pow(1 / durationMatrix[this.cur][city], CHARLIE);   // duration attractiveness raised to charlie
          const attractiveness = pheromone * attractivenessDistance * attractivenessTime;     // combined attractiveness

          probabilities[city] = attractiveness; 
          totalProb += attractiveness;
        }
      }

      // ---- Roulette wheel selection ----
      // Draw a random number in [0,1) and subtract normalized probabilities until it goes below 0.
      let tempProb = Math.random();
      for (let city = 0; city < this.cityNum; city++) {
        // Only consider unvisited cities
        if (!this.visited[city]) {
          probabilities[city] /= totalProb;
          tempProb -= probabilities[city];
          if (tempProb < 0) {
            // Local evaporation on the chosen edge (intensifies exploration)
            pheromoneMatrix[this.cur][city] *= (1 - RHO);
            pheromoneMatrix[city][this.cur] *= (1 - RHO);

            // Move ant to the chosen city
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
    }

    // Build a full tour that visits all cities exactly once
    // then returns to the starting city (0)
    search() {
      const distMatrix = this.parent.distanceMatrix;
      const durationMatrix = this.parent.durationMatrix;
      this.clean();
      while (this.moveCount < this.cityNum) {
        this.next();
      }
      // Close the tour: last city → first city (0)
      this.totalDistance += distMatrix[this.path[this.cityNum - 1]][this.path[0]];
      this.totalDuration += durationMatrix[this.path[this.cityNum - 1]][this.path[0]];
    }
  };

  // -------------------------
  // Run the ACO metaheuristic:
  //   - Create ants
  //   - Repeat for ITER iterations:
  //       * Each ant builds a tour
  //       * Track global best
  //       * Update pheromones globally
  // -------------------------
  run() {
    const startTime = performance.now();

    // Create all ants for this run
    const ants = Array.from(
      { length: this.ANT_NUM }, 
      () => new this.Ant(this, this.CITY_NUM)
    );

    // ---- While stopping criterion not met do ----
    let iter = 0;
    while (iter < this.ITER) {

      // ---- For each ant do ----
      for (const ant of ants) {
        ant.search();
          const dist = ant.totalDistance;
          const dur = ant.totalDuration;
          const score = dist + dur;  

          if (score < this.bestScore) {
            this.bestScore = score;
            this.bestPath = ant.path.slice();
            this.bestPathLength = dist;
            this.bestPathDuration = dur;
          }
      }

      // ---- Store current best (for plotting convergence) ----
      this.bestSolutions.push({
        iteration: iter,
        bestDistance: this.bestPathLength,
        bestDuration: this.bestPathDuration,
      });

      // ---- Global pheromone update based on all ants ----
      const iterationPaths = ants.map(a => a.path);
      const iterationPathLengths = ants.map(a => a.totalDistance);
      this.pheromoneMatrix = this.updatePheromoneMatrix(
        this.pheromoneMatrix,
        iterationPaths,
        iterationPathLengths,
        this.RHO,
        this.Q
      );

      iter++;
    }

    const endTime = performance.now();

    // Final result of the algorithm
    return {   
      bestPath: this.bestPath,                      // best tour (sequence of city indices)
      bestPathLength: this.bestPathLength,          // total distance of best tour
      bestPathDuration: this.bestPathDuration,      // total duration of best tour
      computationTime: endTime - startTime,         // elapsed time
      bestSolutions: this.bestSolutions,            // history of best results per iteration
    };
  }
}

// This module exports a function that runs the ACO algorithm on given distance and duration matrices.
export const acoAlgorithm = (distanceMatrix, durationMatrix) => {
  const aco = new ACO(distanceMatrix, durationMatrix);
  return aco.run();
};