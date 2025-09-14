import { useMemo } from 'react';
import { Table, Container, Row, Col, Badge, Accordion, OverlayTrigger, Tooltip as BSTooltip, Card } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// ---- TIME (ROUTE DURATION) ----
const toMinutes = (val) => {
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

const formatTime = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes)) return 'N/A';
  const totalSeconds = Math.round(minutes * 60);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

// ---- DISTANCE (KM) ----
const toKilometers = (val) => {
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

const formatDistance = (km) => {
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
const toMillis = (val) => {
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

const formatComputeTime = (ms) => {
  if (ms == null || !Number.isFinite(ms)) return 'N/A';
  return `${(ms / 1000).toFixed(2)} s`;
};

// ======================
// Chart data preparation
// ======================
const mergeChartData = (acoDataRaw = [], beamDataRaw = []) => {
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
const analyzeIterations = (arr = []) => {
  if (!arr || arr.length === 0) return null;
  const distances = arr.map(x => toKilometers(x.bestDistance)).filter(v => v != null && Number.isFinite(v));
  if (distances.length === 0) return null;
  const minVal = Math.min(...distances);
  const minIndex = distances.indexOf(minVal);
  const lastVal = distances[distances.length - 1];
  return { length: arr.length, minVal, minIndex, lastVal };
};

// ======================
// Component
// ======================
const EvaluationComponent = ({ evaluationData = {} }) => {
  const aco = evaluationData.aco || {};
  const beam = evaluationData.beam || {};

  const acoTimeMin = useMemo(() => toMinutes(aco.time), [aco.time]);
  const beamTimeMin = useMemo(() => toMinutes(beam.time), [beam.time]);

  const acoDistKm = useMemo(() => (aco.distance != null ? toKilometers(aco.distance) : null), [aco.distance]);
  const beamDistKm = useMemo(() => (beam.distance != null ? toKilometers(beam.distance) : null), [beam.distance]);

  const acoMemBytes = useMemo(() => { const v = toBytes(aco.memoryUsage); return v == null ? v : Math.abs(v); }, [aco.memoryUsage]);
  const beamMemBytes = useMemo(() => { const v = toBytes(beam.memoryUsage); return v == null ? v : Math.abs(v); }, [beam.memoryUsage]);

  console.log(aco.memoryUsage);
  console.log(beam.memoryUsage);

  const acoCompMs = useMemo(() => toMillis(aco.computationTime), [aco.computationTime]);
  const beamCompMs = useMemo(() => toMillis(beam.computationTime), [beam.computationTime]);

  const acoStats = useMemo(() => analyzeIterations(aco.bestPerIteration || []), [aco.bestPerIteration]);
  const beamStats = useMemo(() => analyzeIterations(beam.bestPerIteration || []), [beam.bestPerIteration]);

  const acoFinalDistance = acoStats ? acoStats.minVal : acoDistKm;
  const beamFinalDistance = beamStats ? beamStats.minVal : beamDistKm;

  const winners = {
    distance: (acoFinalDistance != null && beamFinalDistance != null)
      ? (acoFinalDistance < beamFinalDistance ? 'ACO' : (beamFinalDistance < acoFinalDistance ? 'Beam ACO' : 'Tie'))
      : 'N/A',
    time: (acoTimeMin != null && beamTimeMin != null)
      ? (acoTimeMin < beamTimeMin ? 'ACO' : (beamTimeMin < acoTimeMin ? 'Beam ACO' : 'Tie'))
      : 'N/A',
    memory: (acoMemBytes != null && beamMemBytes != null)
      ? (acoMemBytes < beamMemBytes ? 'ACO' : (beamMemBytes < acoMemBytes ? 'Beam ACO' : 'Tie'))
      : 'N/A',
    computeTime: (acoCompMs != null && beamCompMs != null)
      ? (acoCompMs < beamCompMs ? 'ACO' : (beamCompMs < acoCompMs ? 'Beam ACO' : 'Tie'))
      : 'N/A'
  };

  const quickInsights = [];
  if (acoFinalDistance != null && beamFinalDistance != null) {
    const diff = Math.abs(acoFinalDistance - beamFinalDistance);
    const better = winners.distance === 'ACO' ? 'ACO' : winners.distance === 'Beam ACO' ? 'Beam ACO' : 'Neither (tie)';
    quickInsights.push(`${better} produced the shorter route by ${diff.toFixed(2)} km.`);
  } else if (acoFinalDistance != null || beamFinalDistance != null) {
    quickInsights.push('Final distance available only for one algorithm — compare carefully.');
  }

  if (acoStats && beamStats) {
    if (acoStats.minIndex !== beamStats.minIndex) {
      const faster = acoStats.minIndex < beamStats.minIndex ? 'ACO' : 'Beam ACO';
      quickInsights.push(`${faster} reached its best (lowest) distance earlier: ACO @ iteration ${acoStats.minIndex}, Beam ACO @ iteration ${beamStats.minIndex}.`);
    } else {
      quickInsights.push(`Both algorithms reached their best solution at the same iteration (${acoStats.minIndex}).`);
    }
  }

  if (acoCompMs != null && beamCompMs != null) {
    const fasterCompute = acoCompMs < beamCompMs ? 'ACO' : (beamCompMs < acoCompMs ? 'Beam ACO' : 'Tie');
    if (fasterCompute !== 'Tie') quickInsights.push(`${fasterCompute} required less computation time.`);
  }

  if (acoMemBytes != null && beamMemBytes != null) {
    const lighter = acoMemBytes < beamMemBytes ? 'ACO' : (beamMemBytes < acoMemBytes ? 'Beam ACO' : 'Tie');
    if (lighter !== 'Tie') quickInsights.push(`${lighter} had lower memory usage.`);
  }

  const chartData = mergeChartData(aco.bestPerIteration || [], beam.bestPerIteration || []);

  return (
    <Container style={{ padding: '2.5rem', maxWidth: '1080px', background: '#FFFAFA' }}>
      <Row className="mb-3">
        <Col>
          <h5 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            Evaluation Summary
            <OverlayTrigger
              placement="right"
              overlay={<BSTooltip id="tooltip-metrics">This table shows core performance metrics. Lower values are better for time, distance, memory and computation time.</BSTooltip>}
            >
              <span style={{ marginLeft: 8, cursor: 'pointer', color: '#6c757d' }}>ℹ️</span>
            </OverlayTrigger>
          </h5>

          <Table responsive bordered hover size="sm" style={{ fontSize: '0.95rem' }}>
            <thead className="table-light">
              <tr>
                <th>Metric</th>
                <th>ACO</th>
                <th>Beam ACO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Route Time</td>
                <td>
                  {formatTime(acoTimeMin)}
                  {winners.time === 'ACO' && <Badge bg="success" className="ms-2">Better</Badge>}
                </td>
                <td>
                  {formatTime(beamTimeMin)}
                  {winners.time === 'Beam ACO' && <Badge bg="success" className="ms-2">Better</Badge>}
                </td>
              </tr>

              <tr>
                <td>Distance</td>
                <td>
                  {formatDistance(acoFinalDistance)}
                  {winners.distance === 'ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}
                </td>
                <td>
                  {formatDistance(beamFinalDistance)}
                  {winners.distance === 'Beam ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}
                </td>
              </tr>

              <tr>
                <td>Memory Usage</td>
                <td>
                  {formatMemory(acoMemBytes)}
                  {winners.memory === 'ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}
                </td>
                <td>
                  {formatMemory(beamMemBytes)}
                  {winners.memory === 'Beam ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}
                </td>
              </tr>

              <tr>
                <td>Computation Time</td>
                <td>
                  {formatComputeTime(acoCompMs)}
                  {winners.computeTime === 'ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}
                </td>
                <td>
                  {formatComputeTime(beamCompMs)}
                  {winners.computeTime === 'Beam ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}
                </td>
              </tr>
            </tbody>
          </Table>

          <Card className="mb-3">
            <Card.Body style={{ padding: '0.75rem' }}>
              <strong>Quick insights:</strong>
              {quickInsights.length === 0 ? (
                <span className="ms-2 text-muted">No complete metrics available to auto-summarize.</span>
              ) : (
                <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                  {quickInsights.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} style={{ height: 380, padding: '0 1rem' }}>
          <h5 style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
            Convergence Over Iterations
            <OverlayTrigger
              placement="right"
              overlay={<BSTooltip id="tooltip-convergence">This chart shows the best (lowest) route distance the algorithm has found at each iteration. A lower line is better; steep drops show rapid improvement.</BSTooltip>}
            >
              <span style={{ marginLeft: 8, cursor: 'pointer', color: '#6c757d' }}>ℹ️</span>
            </OverlayTrigger>
          </h5>

          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis label={{ value: 'Route Distance (km)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} />
              <RechartsTooltip />
              <Legend />
              {beam.bestPerIteration && (
                <Line type="monotone" dataKey="BeamACO" stroke="#1f77b4" strokeWidth={2} dot={false} />
              )}
              {aco.bestPerIteration && (
                <Line type="monotone" dataKey="ACO" stroke="#2ca02c" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#333' }}>
            <strong>How to read this chart:</strong>
            <span className="ms-2">
              Each point shows the best route distance found up to that iteration. If a line falls quickly it means rapid improvement; if it flattens, the algorithm has converged.
            </span>
          </div>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Detailed interpretation (click to expand)</Accordion.Header>
              <Accordion.Body>
                <h6>What each metric represents</h6>
                <ul>
                  <li><strong>Route Time:</strong> Estimated traversal time across stops. Lower is better.</li>
                  <li><strong>Distance:</strong> Total route length in kilometers. Lower is better for TSP-like problems.</li>
                  <li><strong>Memory Usage:</strong> Peak/typical RAM used in bytes. Lower is better for scaling.</li>
                  <li><strong>Computation Time:</strong> Wall-clock time to complete (ms). Lower is better for responsiveness.</li>
                </ul>

                <h6>Automated comparison summary</h6>
                <ul>
                  <li>
                    <strong>Final best distances:</strong> {acoFinalDistance != null ? `${acoFinalDistance.toFixed(2)}` : 'N/A'} (ACO) vs {beamFinalDistance != null ? `${beamFinalDistance.toFixed(2)}` : 'N/A'} (Beam ACO)
                    {winners.distance !== 'N/A' && winners.distance !== 'Tie' ? (
                      <span className="ms-2"><Badge bg="info">{winners.distance} better (distance)</Badge></span>
                    ) : winners.distance === 'Tie' ? <span className="ms-2"><Badge bg="secondary">Tie</Badge></span> : null}
                  </li>
                  <li>
                    <strong>Convergence speed:</strong> {acoStats && beamStats ? (
                      <span>
                        ACO best @ iteration {acoStats.minIndex}, Beam ACO best @ iteration {beamStats.minIndex}. Lower index = earlier best solution.
                      </span>
                    ) : <span>Insufficient iteration data to compute convergence speed.</span>}
                  </li>
                  <li>
                    <strong>Computation vs quality trade-off:</strong> Consider both compute time and distance together relative to deployment constraints.
                  </li>
                </ul>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
};

export default EvaluationComponent;