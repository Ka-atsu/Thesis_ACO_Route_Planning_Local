// import { MAPBOX_ACCESS_TOKEN } from '../api/config';

// // Helper: Build a waypoints string from a TSP closed path
// export const buildWaypoints = (closedPath, markers) => {
//   return closedPath
//     .map(index => `${markers[index].lng},${markers[index].lat}`)
//     .join(';');
// };

// // New function: Get a continuous route for a segment (max 25 waypoints)
// export const getContinuousRoute = async (closedPath, markers, transportMode, avoidTolls) => {
//   const waypoints = buildWaypoints(closedPath, markers);
//   let directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${transportMode}/${waypoints}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}&exclude=ferry`;

//   if (transportMode === 'driving' && avoidTolls) {
//     directionsUrl += ',toll';
//   }

//   try {
//     // 2) Fetch the directions
//     const response = await fetch(directionsUrl);
//     const data = await response.json();

//     if (data.routes && data.routes.length > 0) {
//       // 3) Build the GeoJSON from the route geometry
//       const routeGeoJSON = {
//         type: 'FeatureCollection',
//         features: [{
//           type: 'Feature',
//           geometry: data.routes[0].geometry
//         }]
//       };

//       // 4) Return or set state with that routeGeoJSON
//       return [{
//         routeTime: Math.round(data.routes[0].duration),
//         routeDistance: data.routes[0].distance / 1000,
//         geoJsonPath: routeGeoJSON
//       }];
//     } else {
//       console.error("No routes found in API response.");
//       return [];
//     }
//   } catch (error) {
//     console.error("Error fetching continuous routes:", error);
//     return [];
//   }
// };

// export const getContinuousRouteSplit = async (closedPath, markers, transportMode, avoidTolls) => {
//   const MAX_WAYPOINTS = 19;
//   let totalDurationBest = 0;
//   let totalDistanceBest = 0;
//   let allCoordsBest = [];

//   // Split path into segments (overlapping points)
//   let segments = [];
//   for (let i = 0; i < closedPath.length - 1; ) {
//     const chunkEnd = Math.min(i + MAX_WAYPOINTS, closedPath.length);
//     const segment = closedPath.slice(i, chunkEnd);
//     if (segment.length < 2) break;
//     segments.push(segment);
//     i = chunkEnd - 1;
//   }

//   console.log("Splitting route into", segments.length, "segments");

//   for (let segment of segments) {
//     // console.log(`Segment sequence of city indices:`, segment);
//     const segmentRoutes = await getContinuousRoute(segment, markers, transportMode, avoidTolls);

//     if (!segmentRoutes || segmentRoutes.length === 0) {
//       console.error("Segment route failed");
//       return {  routeTime: 0, routeDistance: 0, geoJsonPath: { type: 'FeatureCollection', features: [] } };
//     }

//     // Handle Best Route
//     let coordsBest = segmentRoutes[0].geoJsonPath.features[0].geometry.coordinates;
//     if (allCoordsBest.length > 0) coordsBest = coordsBest.slice(1); // remove overlap
//     allCoordsBest.push(...coordsBest);
//     totalDurationBest += segmentRoutes[0].routeTime;
//     totalDistanceBest += segmentRoutes[0].routeDistance;
//   }

//   // Return both best and alternative paths
//   return {
//       routeTime: totalDurationBest,
//       routeDistance: totalDistanceBest,
//       geoJsonPath: {
//         type: 'FeatureCollection',
//         features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: allCoordsBest } }]
//       }
//   };
// };

// Helper: Build a waypoints string from a TSP closed path
export const buildWaypoints = (closedPath, markers) => {
  return closedPath
    .map(index => `${markers[index].lng},${markers[index].lat}`)
    .join(';');
};

// New function: Get a continuous route for a segment (max 25 waypoints)
export const getContinuousRoute = async (closedPath, markers, transportMode, avoidTolls) => {
  const waypoints = buildWaypoints(closedPath, markers);
  let directionsUrl = `http://localhost:5000/route/v1/${transportMode}/${waypoints}?geometries=geojson&overview=full&steps=true`;

  if (transportMode === 'driving' && avoidTolls) {
    directionsUrl += '&exclude=toll';
  }

  try {
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const routeGeoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: data.routes[0].geometry
        }]
      };

      return [{
        routeTime: Math.round(data.routes[0].duration),
        routeDistance: data.routes[0].distance / 1000,
        geoJsonPath: routeGeoJSON
      }];
    } else {
      console.error("No routes found in API response.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching continuous routes:", error);
    return [];
  }
};

export const getContinuousRouteSplit = async (closedPath, markers, transportMode, avoidTolls) => {
  const MAX_WAYPOINTS = 19;
  let totalDurationBest = 0;
  let totalDistanceBest = 0;
  let allCoordsBest = [];

  let segments = [];
  for (let i = 0; i < closedPath.length - 1; ) {
    const chunkEnd = Math.min(i + MAX_WAYPOINTS, closedPath.length);
    const segment = closedPath.slice(i, chunkEnd);
    if (segment.length < 2) break;
    segments.push(segment);
    i = chunkEnd - 1;
  }

  console.log("Splitting route into", segments.length, "segments");

  for (let segment of segments) {
    const segmentRoutes = await getContinuousRoute(segment, markers, transportMode, avoidTolls);

    if (!segmentRoutes || segmentRoutes.length === 0) {
      console.error("Segment route failed");
      return { routeTime: 0, routeDistance: 0, geoJsonPath: { type: 'FeatureCollection', features: [] } };
    }

    let coordsBest = segmentRoutes[0].geoJsonPath.features[0].geometry.coordinates;
    if (allCoordsBest.length > 0) coordsBest = coordsBest.slice(1); // remove overlap
    allCoordsBest.push(...coordsBest);
    totalDurationBest += segmentRoutes[0].routeTime;
    totalDistanceBest += segmentRoutes[0].routeDistance;
  }

  return {
    routeTime: totalDurationBest,
    routeDistance: totalDistanceBest,
    geoJsonPath: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: allCoordsBest } }]
    }
  };
};
