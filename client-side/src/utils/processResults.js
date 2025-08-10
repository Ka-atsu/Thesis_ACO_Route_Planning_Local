import { getContinuousRoute, getContinuousRouteSplit } from './routeUtis';

const processACOandBeamResults = async ({
  acoResultData,
  beamAcoResultData,
  markers,
  transportMode,
  setRoutes,
  setRouteSequences,
  setIsTSPSolved,
  setEvaluationData,
  memoryUsedAco,
  memoryUsedBeamAco
}) => {
  if (!acoResultData || !beamAcoResultData) return;

  const acoClosedPath = [...acoResultData.bestPath, acoResultData.bestPath[0]];
  const beamAcoClosedPath = [...beamAcoResultData.bestPath, beamAcoResultData.bestPath[0]];

  let routeResults;

  if (acoClosedPath.length > 20 || beamAcoClosedPath.length > 20) {
    const acoRoutes = await getContinuousRouteSplit(acoClosedPath, markers, transportMode);
    const beamAcoRoutes = await getContinuousRouteSplit(beamAcoClosedPath, markers, transportMode);
    routeResults = { aco: acoRoutes, beam: beamAcoRoutes };
  } else {
    const acoRoutes = await getContinuousRoute(acoClosedPath, markers, transportMode);
    const beamAcoRoutes = await getContinuousRoute(beamAcoClosedPath, markers, transportMode);
    routeResults = { aco: acoRoutes[0], beam: beamAcoRoutes[0] };
  }

  if (!routeResults) return;

    setRoutes({
    aco: routeResults.aco.geoJsonPath,
    beam: routeResults.beam.geoJsonPath
    });
    setRouteSequences(prev => ({
      ...prev,
      aco: acoClosedPath.map(index => index + 1),
      beam: beamAcoClosedPath.map(index => index + 1),
    }));

  setIsTSPSolved(true);

  setEvaluationData({
    aco: {
      time: acoResultData.bestPathDuration,
      distance: acoResultData.bestPathLength,
      bestPerIteration: acoResultData.bestSolutions,
      computationTime: acoResultData.computationTime,
      memoryUsage: memoryUsedAco,
    },
    beam: routeResults.beam ? {
      time: beamAcoResultData.bestPathDuration,
      distance: beamAcoResultData.bestPathLength,
      bestPerIteration: beamAcoResultData.bestSolutions,
      computationTime: beamAcoResultData.computationTime,
      memoryUsage: memoryUsedBeamAco,
    } : null,
  });
};

export default processACOandBeamResults;
