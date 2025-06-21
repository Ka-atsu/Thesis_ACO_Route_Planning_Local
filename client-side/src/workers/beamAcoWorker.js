/* eslint-disable no-restricted-globals */

// import { acoAlgorithm } from "../utils/traditionalACO";
import { beamAcoAlgorithm } from "../utils/beamACO";

self.onmessage = async (event) => {
  const { distanceMatrix, durationMatrix } = event.data;
  console.log("Worker: Received distance matrix, starting computations...");

  // Run both algorithms simultaneously
//   const acoResult = acoAlgorithm(distanceMatrix, durationMatrix);
  const beamAcoResult = beamAcoAlgorithm(distanceMatrix, durationMatrix);

  // Send both results back to the main thread
  self.postMessage({
    // acoResult,
    beamAcoResult,
  });
};

/* eslint-enable no-restricted-globals */
