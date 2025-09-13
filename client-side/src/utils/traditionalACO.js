class ACO {
  constructor(distanceMatrix, durationMatrix) {
    this.distanceMatrix = distanceMatrix;
    this.durationMatrix = durationMatrix;

    // ---- Parameters ----
    this.CITY_NUM = distanceMatrix.length;                      // number of cities
    this.ANT_NUM = Math.max(10, Math.floor(this.CITY_NUM / 2)); // number of ants
    this.ITER = 200;                                            // number of iterations
    this.INITIAL_PHEROMONE = 0.200;                             // initial pheromone influence
    this.ALPHA = 1;                                             // pheromone influence
    this.RHO = 0.5;                                             // pheromone evaporation rate
    this.Q = 1;                                                 // pheromone deposit constant
    this.GAMMA = 3;                                             // distance attractiveness
    this.DELTA = 2;                                             // duration attractiveness

    // ---- State ----
    this.pheromoneMatrix = this.initializePheromoneMatrix(this.CITY_NUM); // pheromone levels
    this.bestPath = null;                                                 // best path found so far
    this.bestPathLength = Infinity;                                       // best distance found so far
    this.bestPathDuration = Infinity;                                     // best duration found so far
    this.bestSolutions = [];                                              // track progress across iterations
  }

  // -------------------------
  // Pheromone matrix initialization
  // -------------------------
  initializePheromoneMatrix(numCities) {
    return Array.from({ length: numCities }, () =>
      new Array(numCities).fill(this.INITIAL_PHEROMONE)
    );
  }

  // -------------------------
  // Pheromone update (evaporation + deposit)
  // -------------------------
  updatePheromoneMatrix(pheromoneMatrix, allPaths, allPathLengths, pheromoneDecay, pheromoneConstant) {
    // Evaporation (reduce pheromone everywhere)
    for (let i = 0; i < pheromoneMatrix.length; i++) {
      // Reduce pheromone by a decay factor (and add some randomness)
      for (let j = 0; j < pheromoneMatrix[i].length; j++) {
        pheromoneMatrix[i][j] *= (pheromoneDecay + Math.random() * 0.05);
      }
    }

    // Deposit (add pheromone proportional to path quality)
    for (let i = 0; i < allPaths.length; i++) {
      const path = allPaths[i];
      const pheromoneDeposit = pheromoneConstant / (allPathLengths[i] * (Math.random() * 0.5 + 1));
      for (let j = 0; j < path.length - 1; j++) {
        pheromoneMatrix[path[j]][path[j + 1]] += pheromoneDeposit; // deposit pheromone on the path
        pheromoneMatrix[path[j + 1]][path[j]] += pheromoneDeposit; // ensure symmetry
      }
    }
    return pheromoneMatrix;
  }

  // -------------------------
  // Ant class (inner class of ACO)
  // Each ant builds a path and evaluates it
  // -------------------------
  Ant = class {
    constructor(parent, cityNum) {
      this.parent = parent; // reference back to ACO instance
      this.cityNum = cityNum;  // number of cities in this ACO instance
      this.clean(); 
    }

    // Reset ant state
    clean() {
      this.path = [0];                                      // start at city 0
      this.visited = new Array(this.cityNum).fill(false);   // visited cities
      this.visited[0] = true;                               // mark start as visited
      this.totalDistance = 0;                               // total distance and duration
      this.totalDuration = 0;                               // total distance and duration
      this.moveCount = 1;                                   // start with one move (at city 0)                 
      this.cur = 0;                                         // current city
    }

    // Choose next city (probabilistic decision)
    next() {
      const distMatrix = this.parent.distanceMatrix;         // distance matrix
      const durationMatrix = this.parent.durationMatrix;     // duration matrix
      const pheromoneMatrix = this.parent.pheromoneMatrix;   // pheromone levels

      const ALPHA = this.parent.ALPHA;                       // pheromone influence
      const GAMMA = this.parent.GAMMA;                       // distance attractiveness
      const DELTA = this.parent.DELTA;                       // duration attractiveness
      const RHO = this.parent.RHO;                           // pheromone evaporation rate

      let probabilities = new Array(this.cityNum).fill(0);   // probabilities for each city
      let totalProb = 0;                                     // total probability for normalization

      // Calculate attractiveness for each unvisited city
      for (let city = 0; city < this.cityNum; city++) {
        // Only consider unvisited cities
        if (!this.visited[city]) {
          const pheromone = Math.pow(pheromoneMatrix[this.cur][city], ALPHA);               // pheromone level raised to alpha
          const attractivenessDistance = Math.pow(1 / distMatrix[this.cur][city], GAMMA);   // distance attractiveness raised to gamma
          const attractivenessTime = Math.pow(1 / durationMatrix[this.cur][city], DELTA);   // duration attractiveness raised to delta
          const attractiveness = pheromone * attractivenessDistance * attractivenessTime;   // combined attractiveness

          probabilities[city] = attractiveness;    // store attractiveness for this city
          totalProb += attractiveness;             // accumulate total probability
        }
      }

      // Roulette wheel selection: pick city based on probability distribution
      let tempProb = Math.random();
      for (let city = 0; city < this.cityNum; city++) {
        // Only consider unvisited cities
        if (!this.visited[city]) {
          probabilities[city] /= totalProb;  // normalize
          tempProb -= probabilities[city];   // subtract normalized probability
          if (tempProb < 0) {
            pheromoneMatrix[this.cur][city] *= (1 - RHO); // local evaporation
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

    // Perform a full tour of all cities and return to start
    search() {
      const distMatrix = this.parent.distanceMatrix;
      const durationMatrix = this.parent.durationMatrix;
      this.clean();
      while (this.moveCount < this.cityNum) {
        this.next();
      }
      // close the loop: return to starting city
      this.totalDistance += distMatrix[this.path[this.cityNum - 1]][this.path[0]];
      this.totalDuration += durationMatrix[this.path[this.cityNum - 1]][this.path[0]];
    }
  };

  // -------------------------
  // Run the main ACO loop
  // -------------------------
  run() {
    const startTime = performance.now();

    // create all ants for this run
    const ants = Array.from({ length: this.ANT_NUM }, () => new this.Ant(this, this.CITY_NUM));

    // === While stopping criterion not met do ===
    let iter = 0;
    while (iter < this.ITER) {

      // === For each ant do ===
      for (const ant of ants) {
        ant.search(); // build a solution

        // check if this ant found a new best path
        if (
          ant.totalDistance < this.bestPathLength ||
          (ant.totalDistance === this.bestPathLength && ant.totalDuration < this.bestPathDuration)
        ) {
          this.bestPath = ant.path.slice();
          this.bestPathLength = ant.totalDistance;
          this.bestPathDuration = ant.totalDuration;
        }
      }

      // store best results so far (useful for convergence plots)
      this.bestSolutions.push({
        iteration: iter,
        bestDistance: this.bestPathLength,
        bestDuration: this.bestPathDuration,
      });

      // update pheromones based on ants’ paths
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
    const computationTime = endTime - startTime;

    // return final results
    return {
      bestPath: this.bestPath,
      bestPathLength: this.bestPathLength,
      bestPathDuration: this.bestPathDuration,
      computationTime,
      bestSolutions: this.bestSolutions,
    };
  }
}

// This module exports a function that runs the ACO algorithm on given distance and duration matrices.
export const acoAlgorithm = (distanceMatrix, durationMatrix) => {
  const aco = new ACO(distanceMatrix, durationMatrix);
  return aco.run();
};