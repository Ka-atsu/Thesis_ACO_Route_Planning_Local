// datasetUtils.js
export function inferDatasetName(route, markers = []) {
  // 1) Prefer explicit name on the saved route (case-insensitive)
  const n = route && route.name ? route.name.toLowerCase() : "";
  if (/\bcabuyao\b/.test(n) || /\b50\b/.test(n)) return "Cabuyao (50 Stops)";
  if (/\blaguna\b/.test(n) || /\b150\b/.test(n)) return "Laguna (150 Stops)";
  if (/\b(luzon|philippines)\b/.test(n) || /\b250\b/.test(n)) return "Philippines (250 Stops)";

  // 2) Fallback: infer by marker count (exact or near-exact)
  const m = Array.isArray(markers) ? markers.length : 0;
  if (m === 50 || (m >= 45 && m <= 55)) return "Cabuyao (50 Stops)";
  if (m === 150 || (m >= 140 && m <= 160)) return "Laguna (150 Stops)";
  if (m === 250 || (m >= 240 && m <= 260)) return "Philippines (250 Stops)";

  // 3) Last resort: generic label
  return `Custom Dataset (${m} Stops)`;
}

// ---- TIME (ROUTE DURATION) ----
export const toMinutes = (val) => {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    const hms = s.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (hms) {
      const h = parseInt(hms[1], 10), m = parseInt(hms[2], 10), sec = parseInt(hms[3], 10);
      return h * 60 + m + sec / 60;
    }
    const sec = s.match(/^(\d+(?:\.\d+)?)\s*s$/i);
    if (sec) return parseFloat(sec[1]) / 60;
    const min = s.match(/^(\d+(?:\.\d+)?)\s*m$/i);
    if (min) return parseFloat(min[1]);
    const hm = s.match(/^(\d+(?:\.\d+)?)\s*h(?:\s*(\d+(?:\.\d+)?)\s*m)?$/i);
    if (hm) return parseFloat(hm[1]) * 60 + (hm[2] ? parseFloat(hm[2]) : 0);
    const n = Number.parseFloat(s);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export const formatTime = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes)) return 'N/A';
  const totalSeconds = Math.round(minutes * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// ---- DISTANCE (KM) ----
export const toKilometers = (val) => {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const s = val.trim().toUpperCase().replace(/,/g, '');
    if (s.endsWith('KM')) return parseFloat(s);
    if (s.endsWith('M')) return parseFloat(s) / 1000;
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(km)) return 'N/A';
  return `${km.toFixed(2)} km`;
};

// ---- MEMORY (BYTES) ----
export const toBytes = (val) => {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.round(val); // already bytes
  }
  if (typeof val === 'string') {
    const s = val.trim().toUpperCase().replace(/,/g, '');
    const num = parseFloat(s);
    if (!Number.isFinite(num)) return null;
    return Math.round(num); // assume string also in bytes
  }
  return null;
};

export const formatMemory = (bytes) => {
  if (bytes == null || !Number.isFinite(bytes)) return 'N/A';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
};

// ---- COMPUTATION TIME (MS) ----
export const toMillis = (val) => {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val < 60 ? Math.round(val * 1000) : Math.round(val);
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    const ms = s.match(/^(\d+(?:\.\d+)?)\s*ms$/);
    if (ms) return Math.round(parseFloat(ms[1]));
    const sec = s.match(/^(\d+(?:\.\d+)?)\s*s$/);
    if (sec) return Math.round(parseFloat(sec[1]) * 1000);
    const n = Number.parseFloat(s);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
};

export const formatComputeTime = (ms) => {
  if (ms == null || !Number.isFinite(ms)) return 'N/A';
  return `${(ms / 1000).toFixed(2)} s`;
};

// ======================
// Chart data preparation
// ======================
export const mergeChartData = (acoDataRaw = [], beamDataRaw = []) => {
  const maxLength = Math.max(acoDataRaw.length, beamDataRaw.length);
  const data = [];
  for (let i = 0; i < maxLength; i++) {
    const acoScore = acoDataRaw[i] != null ? toKilometers(acoDataRaw[i].bestDistance) : null;
    const beamScore = beamDataRaw[i] != null ? toKilometers(beamDataRaw[i].bestDistance) : null;
    data.push({
      iteration: i,
      ACO: acoScore != null ? parseFloat(acoScore.toFixed(2)) : null,
      BeamACO: beamScore != null ? parseFloat(beamScore.toFixed(2)) : null
    });
  }
  return data;
};

// Small analysis helpers
export const analyzeIterations = (arr = []) => {
  if (!arr || arr.length === 0) return null;
  const distances = arr.map(x => toKilometers(x.bestDistance)).filter(v => v != null && Number.isFinite(v));
  if (distances.length === 0) return null;
  const minVal = Math.min(...distances);
  const minIndex = distances.indexOf(minVal);
  const lastVal = distances[distances.length - 1];
  return { length: arr.length, minVal, minIndex, lastVal };
};

export function inferStopsFromDatasetName(name = "") {
  const n = (name || "").toLowerCase();
  if (/\b50\b/.test(n) || /cabuyao/.test(n)) return 50;
  if (/\b150\b/.test(n) || /laguna/.test(n)) return 150;
  if (/\b250\b/.test(n) || /(philippines|luzon)/.test(n)) return 250;
  // generic fallback: first number in the string (e.g., "Custom Dataset (120 Stops)")
  const m = name.match(/\b(\d{2,4})\b/);
  return m ? Number(m[1]) : null;
}
