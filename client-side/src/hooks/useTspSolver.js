import { useState, useEffect } from 'react';
import { calculateDistanceMatrix } from '../utils/calculateDistanceMatrix';
import processACOandBeamResults from '../utils/processResults';

const useTspSolver = ({ markers, transportMode, setRoutes, setRouteSequences, setEvaluationData }) => {
  const [isTSPSolved, setIsTSPSolved] = useState(false);

  useEffect(() => {
    if (isTSPSolved) solveTSP();
    // eslint-disable-next-line
  }, [transportMode]);

  const solveTSP = async () => {
    if (markers.length < 2) {
      console.log('Need at least two markers to solve TSP');
      return;
    }

    const { distanceMatrix, durationMatrix } = await calculateDistanceMatrix(markers, transportMode);
    if (!distanceMatrix || !durationMatrix || distanceMatrix.length === 0) {
      console.error("Invalid matrix");
      return;
    }

    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const acoWorker = new Worker(new URL('../workers/acoWorker.js', import.meta.url));
    const beamAcoWorker = new Worker(new URL('../workers/beamAcoWorker.js', import.meta.url));

    let acoResultData = null;
    let beamAcoResultData = null;
    let memoryUsedAco = 0;
    let memoryUsedBeamAco = 0;

    const processResults = () => {
      if (acoResultData && beamAcoResultData) {
        processACOandBeamResults({
          acoResultData,
          beamAcoResultData,
          markers,
          transportMode,
          setRoutes,
          setRouteSequences,
          setIsTSPSolved,
          setEvaluationData,
          memoryUsedAco,
          memoryUsedBeamAco,
        });
      }
    };

    acoWorker.onmessage = ({ data }) => {
      const { acoResult } = data;
      if (!acoResult) {
        console.error("ACO result is null");
        return;
      }
      memoryUsedAco = (performance.memory?.usedJSHeapSize || 0) - memoryBefore;
      acoResultData = acoResult;
      processResults();
      acoWorker.terminate();
    };

    beamAcoWorker.onmessage = ({ data }) => {
      const { beamAcoResult } = data;
      if (!beamAcoResult) {
        console.error("Beam ACO result is null");
        return;
      }
      memoryUsedBeamAco = (performance.memory?.usedJSHeapSize || 0) - memoryBefore;
      beamAcoResultData = beamAcoResult;
      processResults();
      beamAcoWorker.terminate();
    };

    acoWorker.onerror = (error) => {
      console.error("Error in ACO Worker:", error.message);
    };
    beamAcoWorker.onerror = (error) => {
      console.error("Error in Beam ACO Worker:", error.message);
    };

    acoWorker.postMessage({ distanceMatrix, durationMatrix });
    beamAcoWorker.postMessage({ distanceMatrix, durationMatrix });

    setIsTSPSolved(true);
  };

  return { solveTSP, isTSPSolved };
};

export default useTspSolver;