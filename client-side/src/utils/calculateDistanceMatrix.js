// import { MAPBOX_ACCESS_TOKEN } from '../api/config';

// // Helper function to round a number to 4 decimal places.
// const roundTo4Decimals = (value) => Math.round(value * 10000) / 10000;

// --- Real-time bounded noise utilities ---
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6D2B79F5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pairSeed = (seedBase, i, j, bucketIndex) =>
  (seedBase * 73856093) ^ (i * 19349663) ^ (j * 83492791) ^ (bucketIndex * 2654435761);

const lerp = (a, b, t) => a + (b - a) * t;

const boundsForVariant = (variant) => {
  if (variant === "beam") return [0.92, 1.08]; // ±8%
  if (variant === "aco")  return [0.96, 1.04]; // ±4%
  return [1.00, 1.00];
};

// Smooth factor changes every `windowMs` with cross-fade
const timeVaryingFactor = ({ variant, seedBase, i, j, nowMs, windowMs = 30000 }) => {
  const [lo, hi] = boundsForVariant(variant);
  const bucket = Math.floor(nowMs / windowMs);
  const frac   = (nowMs % windowMs) / windowMs;

  const base = seedBase + (variant === "beam" ? 1 : 2);
  const rngA = mulberry32(pairSeed(base, i, j, bucket));
  const rngB = mulberry32(pairSeed(base, i, j, bucket + 1));

  const a = lo + rngA() * (hi - lo);
  const b = lo + rngB() * (hi - lo);

  return lerp(a, b, frac);
};

// Convert markers to a waypoints string for Mapbox API
const buildWaypointsString = (markers) => {
  return markers.map(m => `${m.lng},${m.lat}`).join(';');
};

// Validate markers before sending API request
const validateMarkers = (markers) => {
  return markers.every(m =>
    typeof m.lat === "number" && !isNaN(m.lat) &&
    typeof m.lng === "number" && !isNaN(m.lng)
  );
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

// Function to calculate travel duration based on transport mode with minor randomness
const calculateDuration = (
  distanceKm,
  transportMode,
  variant = "normal",
  { seedBase = 0, i = 0, j = 0, nowMs = Date.now(), windowMs = 30000 } = {}
) => {
  let baseSpeed;
  switch (transportMode) {
    case "driving": baseSpeed = 50; break;
    case "walking": baseSpeed = 5;  break;
    case "cycling": baseSpeed = 15; break;
    default:        baseSpeed = 50;
  }

  const baselineMinutes = (distanceKm / baseSpeed) * 60;
  const tf = timeVaryingFactor({ variant, seedBase, i, j, nowMs, windowMs });
  return baselineMinutes * tf;
};

// Function to fetch a full matrix when markers are <= 25 (single request)
const fetchFullMatrix = async (markers, transportMode) => {
  const waypoints = buildWaypointsString(markers);
  const portMap = {
  driving: 5000,
  cycling: 5001,
  walking: 5002
  };

  const port = portMap[transportMode] || 5000;
  const matrixUrl = `http://localhost:${port}/table/v1/driving/${waypoints}?annotations=distance,duration`;
  // const matrixUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/${transportMode}/${waypoints}?annotations=distance,duration&access_token=${MAPBOX_ACCESS_TOKEN}`;
  
  // console.log("📡 Requesting Full Distance Matrix:", matrixUrl);
  try {
    const response = await fetch(matrixUrl);
    if (!response.ok) {
      console.error(`🚨 API Request Failed! Status: ${response.status}`);
      return { distanceMatrix: [], durationMatrix: [] };
    }
    const data = await response.json();
    // console.log("📡 API Full Matrix Response:", data);
    if (!data.distances || !data.durations) {
      console.error("🚨 API response missing data:", data);
      return { distanceMatrix: [], durationMatrix: [] };
    }
    // Convert distances from meters to kilometers and round to 4 decimal places.
    const normalizedDistances = data.distances.map(row => row.map(val => val / 1000));
    // Round durations to 4 decimal places.
    const normalizedDurations = data.durations.map(row => row.map(val => val));
    
    console.log("Full Distance Matrix:", normalizedDistances);
    console.log("Full Duration Matrix:", normalizedDurations);

    return { distanceMatrix: normalizedDistances, durationMatrix: normalizedDurations };
  } catch (error) {
    console.error("🔥 Error fetching full distance matrix:", error);
    return { distanceMatrix: [], durationMatrix: [] };
  }
};

// New function: Calculate full matrix using block (cross‑block) requests
export const calculateDistanceMatrix = async (markers, transportMode) => {
  if (markers.length < 2) {
    console.error("🚨 Not enough markers! At least 2 are required.");
    return { distanceMatrix: [], durationMatrix: [] };
  }
  if (!validateMarkers(markers)) {
    console.error("🚨 Invalid markers detected! Some markers have undefined or NaN coordinates.");
    return { distanceMatrix: [], durationMatrix: [] };
  }
  
  // If markers are 25 or fewer, fetch the full matrix directly.
  if (markers.length <= 25) {
    const { distanceMatrix, durationMatrix } = await fetchFullMatrix(markers, transportMode);

    const nowMs = Date.now();       // or pass this from the caller for global control
    const seedBase = 20251101;      // stable base (route id / day / build, up to you)
    const variant = "beam";         // or "aco" — pass from caller

    const adjustedDurations = durationMatrix.map((row, i) =>
      row.map((min, j) => {
        if (!Number.isFinite(min)) return min;
        const tf = timeVaryingFactor({ variant, seedBase, i, j, nowMs, windowMs: 30000 });
        return min * tf;
      })
    );

    return { distanceMatrix, durationMatrix: adjustedDurations };
  }

  const n = markers.length;
  const distanceMatrix = Array.from({ length: n }, () => Array(n).fill(0));
  const durationMatrix = Array.from({ length: n }, () => Array(n).fill(0));

  const nowMs = Date.now();
  const seedBase = 20251101;
  const variant = "aco";

  // Calculate the distance and duration between each pair of markers using Haversine formula and transport mode
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const { lat: lat1, lng: lon1 } = markers[i];
      const { lat: lat2, lng: lon2 } = markers[j];

      const distance = haversine(lat1, lon1, lat2, lon2);
      const duration = calculateDuration(distance, transportMode, variant, {
        seedBase, i, j, nowMs, windowMs: 30000,
      });

      distanceMatrix[i][j] = distanceMatrix[j][i] = distance;
      durationMatrix[i][j] = durationMatrix[j][i] = duration;
    }
  }

  console.log("Full Distance Matrix (n x n):", distanceMatrix);
  console.log("Full Duration Matrix (n x n):", durationMatrix);
  
  // // For more than 25 markers, partition the markers into blocks.
  // // Use a block size of 12 to stay within Mapbox's 25-coordinate limit.
  // const blockSize = 12;
  // const blocks = [];
  // for (let i = 0; i < markers.length; i += blockSize) {
  //   blocks.push(markers.slice(i, i + blockSize));
  // }
  // // console.log("Total blocks:", blocks.length);
  
  // // Prepare an empty full matrix (n x n) filled with Infinity.
  // const n = markers.length;
  // const fullMatrix = Array.from({ length: n }, () => Array(n).fill(Infinity));
  // const fullDurations = Array.from({ length: n }, () => Array(n).fill(Infinity));
  
  // // For each pair of blocks, request the matrix for that block pair.
  // for (let i = 0; i < blocks.length; i++) {
  //   for (let j = 0; j < blocks.length; j++) {
  //     const blockA = blocks[i];
  //     const blockB = blocks[j];
      
  //     // Combined list: blockA followed by blockB.
  //     const combined = [...blockA, ...blockB];
  //     // Sources are indices [0, blockA.length - 1]
  //     const sources = Array.from({ length: blockA.length }, (_, idx) => idx);
  //     // Destinations are indices [blockA.length, blockA.length + blockB.length - 1]
  //     const destinations = Array.from({ length: blockB.length }, (_, idx) => blockA.length + idx);
      
  //     const combinedWaypoints = buildWaypointsString(combined);
  //     // Build the URL with sources and destinations parameters.
  //     const matrixUrl = `https://api.mapbox.com/directions-matrix/v1/mapbox/${transportMode}/${combinedWaypoints}?annotations=distance,duration&access_token=${MAPBOX_ACCESS_TOKEN}&sources=${sources.join(';')}&destinations=${destinations.join(';')}`;
      
  //     // console.log(`📡 Requesting block matrix for blocks [${i}] and [${j}]:`, matrixUrl);
  //     try {
  //       const response = await fetch(matrixUrl);
  //       if (!response.ok) {
  //         console.error(`🚨 Block API Request Failed! Status: ${response.status}`);
  //         continue;
  //       }
  //       const data = await response.json();
  //       // console.log(`📡 Block API Response for blocks [${i}] and [${j}]:`, data);
  //       if (!data.distances || !data.durations) {
  //         console.error("🚨 Block API response missing data:", data);
  //         continue;
  //       }
  //       // Data arrays size: blockA.length x blockB.length.
  //       const rowStart = i * blockSize;
  //       const colStart = j * blockSize;
  //       for (let r = 0; r < data.distances.length; r++) {
  //         for (let c = 0; c < data.distances[r].length; c++) {
  //           const globalRow = rowStart + r;
  //           const globalCol = colStart + c;
  //           if (globalRow < n && globalCol < n) {
  //             // Normalize: Convert meters to kilometers and round to 4 decimal places.
  //             fullMatrix[globalRow][globalCol] = data.distances[r][c] / 1000;
  //             // Round durations to 4 decimal places.
  //             fullDurations[globalRow][globalCol] = data.durations[r][c];
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error("🔥 Error fetching block matrix:", error);
  //     }
  //   }
  // }

  return {
    distanceMatrix: distanceMatrix,
    durationMatrix: durationMatrix
  };
};