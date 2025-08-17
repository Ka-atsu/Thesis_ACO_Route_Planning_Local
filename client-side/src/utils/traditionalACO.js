const initializePheromoneMatrix = (numCities) => {
  const matrix = [];
  for (let i = 0; i < numCities; i++) {
    matrix[i] = [];
    for (let j = 0; j < numCities; j++) {
      matrix[i][j] = Math.random() * 0.1 + 0.1;  // Starting pheromone value with randomness
    }
  }
  return matrix;
};

const updatePheromoneMatrix = (pheromoneMatrix, allPaths, allPathLengths, pheromoneDecay, pheromoneConstant) => {
  // Variable pheromone decay (decay more on shorter paths)
  for (let i = 0; i < pheromoneMatrix.length; i++) {
    for (let j = 0; j < pheromoneMatrix[i].length; j++) {
      pheromoneMatrix[i][j] *= (pheromoneDecay + Math.random() * 0.05);  // Decay with added randomness
    }
  }

  // Add new pheromone based on path lengths, but with a twist
  for (let i = 0; i < allPaths.length; i++) {
    const path = allPaths[i];
    const pheromoneDeposit = pheromoneConstant / (allPathLengths[i] * (Math.random() * 0.5 + 1)); // Variable pheromone deposit
    for (let j = 0; j < path.length - 1; j++) {
      pheromoneMatrix[path[j]][path[j + 1]] += pheromoneDeposit;
      pheromoneMatrix[path[j + 1]][path[j]] += pheromoneDeposit;  // Make sure it's symmetric
    }
  }
  return pheromoneMatrix;
};

export const acoAlgorithm = (distanceMatrix, durationMatrix) => {
  const CITY_NUM = distanceMatrix.length; // Number of cities
  const ANT_NUM = Math.max(10, Math.floor(CITY_NUM / 2));  // Number of ants
  const ITER = 200;  // Number of iterations
  const ALPHA = 1;  // Influence of pheromone
  const RHO = 0.5;  // Pheromone decay
  const Q = 1;  // Pheromone deposit constant
  const GAMMA = 3;  // Influence of distance attractiveness
  const DELTA = 2;  // Influence of duration attractiveness

  let pheromoneMatrix = initializePheromoneMatrix(CITY_NUM);  // Initialize pheromone matrix
  let bestPath = null;  // Track the best path found so far
  let bestPathLength = Infinity;  // Best path length (initially set to Infinity)
  let bestPathDuration = Infinity;  // Best path duration (initially set to Infinity)

  // Start measuring time here
  const startTime = performance.now();  // Start the timer

  // Array to track the best solution at each iteration for plotting
  const bestSolutions = []; // To track convergence speed

  // Ant class to simulate the movement of ants
  class Ant {
    constructor(cityNum) {
      this.cityNum = cityNum;
      this.clean();
    }

    clean() {
      this.path = [0];  // Start from city 0
      this.visited = new Array(this.cityNum).fill(false);
      this.visited[0] = true;
      this.totalDistance = 0;
      this.totalDuration = 0;
      this.moveCount = 1;
      this.cur = 0;  // Current city
    }

    next(alpha, distMatrix, durationMatrix, pheromoneMatrix) {
      let probabilities = new Array(this.cityNum).fill(0);
      let totalProb = 0;

      const randomExplorationRate = 0.05;  
      if (Math.random() < randomExplorationRate) {
        // collect all unvisited cities
        const unvisited = [];
        for (let c = 0; c < this.cityNum; c++) {
          if (!this.visited[c]) unvisited.push(c);
        }
        // pick one at random
        const nextCity = unvisited[Math.floor(Math.random() * unvisited.length)];
        // local pheromone evaporation
        pheromoneMatrix[this.cur][nextCity] *= (1 - RHO);
        // move there
        this.path.push(nextCity);
        this.visited[nextCity] = true;
        this.totalDistance += distMatrix[this.cur][nextCity];
        this.totalDuration += durationMatrix[this.cur][nextCity];
        this.cur = nextCity;
        this.moveCount++;
      return;
      }

        // Calculate the attractiveness of all unvisited cities
        for (let city = 0; city < this.cityNum; city++) {
          if (!this.visited[city]) {
            const pheromone = Math.pow(pheromoneMatrix[this.cur][city], alpha);
            const attractivenessDistance = Math.pow(1 / distMatrix[this.cur][city], GAMMA);
            const attractivenessTime = Math.pow(1 / durationMatrix[this.cur][city], DELTA);
            const attractiveness = pheromone * attractivenessDistance * attractivenessTime;

            probabilities[city] = attractiveness;
            totalProb += attractiveness;
          }
        }

        // Select the next city based on probabilities
        let tempProb = Math.random();
        for (let city = 0; city < this.cityNum; city++) {
          if (!this.visited[city]) {
            probabilities[city] /= totalProb;  // Normalize probabilities
            tempProb -= probabilities[city];
            if (tempProb < 0) {
              pheromoneMatrix[this.cur][city] *= (1 - RHO);  // Local pheromone evaporation
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

    search(alpha, distMatrix, durationMatrix, pheromoneMatrix) {
      this.clean();
      while (this.moveCount < this.cityNum) {
        this.next(alpha, distMatrix, durationMatrix, pheromoneMatrix);
      }
      // Complete the tour (return to the start city)
      this.totalDistance += distMatrix[this.path[this.cityNum - 1]][this.path[0]];
      this.totalDuration += durationMatrix[this.path[this.cityNum - 1]][this.path[0]];
    }
  }

  let ants = Array.from({ length: ANT_NUM }, () => new Ant(CITY_NUM));  // Create ants

  // Run the algorithm for multiple iterations
  for (let iter = 0; iter < ITER; iter++) {
    // Let each ant traverse the cities and record their paths
    for (let ant of ants) {
      ant.search(ALPHA, distanceMatrix, durationMatrix, pheromoneMatrix);
      
      // If this ant's path is better than the best path so far, update the best path
      if (ant.totalDistance < bestPathLength || (ant.totalDistance === bestPathLength && ant.totalDuration < bestPathDuration)) {
        bestPath = ant.path.slice();
        bestPathLength = ant.totalDistance;
        bestPathDuration = ant.totalDuration;
      }
    }
    
    // Track the best solution (distance) after this iteration for convergence plotting
    bestSolutions.push({ iteration: iter, bestDistance: bestPathLength, bestDuration: bestPathDuration });

    // Update pheromone matrix after each iteration based on the ants' paths
    let iterationPaths = ants.map(ant => ant.path);
    let iterationPathLengths = ants.map(ant => ant.totalDistance);

    // Update pheromone levels
    pheromoneMatrix = updatePheromoneMatrix(pheromoneMatrix, iterationPaths, iterationPathLengths, RHO, Q);
  }

  const endTime = performance.now();  // End the timer
  const computationTime = endTime - startTime;  // Calculate the elapsed time

  // Return the best path found after all iterations
  return {
    bestPath: bestPath,
    bestPathLength: bestPathLength,
    bestPathDuration: bestPathDuration,
    computationTime: computationTime,
    bestSolutions,  
  };
};