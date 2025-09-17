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

export const formatTime = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes)) return 'N/A';
  const totalSeconds = Math.round(minutes * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(km)) return 'N/A';
  return `${km.toFixed(2)} km`;
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
