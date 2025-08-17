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

// ------------------------
// Formatting data for display
// ------------------------
const formatTime = (minutes) => {
  if (minutes == null) return 'N/A';
  const totalSeconds = minutes * 60;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

const formatDistance = (km) => {
  if (km == null) return 'N/A';
  // keep same behavior as your original component (assumes meters input; shows km)
  return `${(km).toFixed(2)} km`;
};

const formatMemory = (bytes) => {
  if (bytes == null) return 'N/A';
  return `${(Math.abs(bytes) / 1024).toFixed(2)} KB`;
};

const formatComputeTime = (ms) => {
  if (ms == null) return 'N/A';
  return `${(ms / 1000).toFixed(2)} s`;
};

// ------------------------
// Prepare chart data
// ------------------------
const mergeChartData = (acoDataRaw = [], beamDataRaw = []) => {
  const maxLength = Math.max(acoDataRaw.length, beamDataRaw.length);
  const data = [];

  for (let i = 0; i < maxLength; i++) {
    const acoScore = acoDataRaw[i] != null ? acoDataRaw[i].bestDistance : null;
    const beamScore = beamDataRaw[i] != null ? beamDataRaw[i].bestDistance : null;

    data.push({
      iteration: i,
      ACO: acoScore != null ? parseFloat(acoScore.toFixed(2)) : null,
      BeamACO: beamScore != null ? parseFloat(beamScore.toFixed(2)) : null
    });
  }

  return data;
};

// ------------------------
// Small analysis helpers
// ------------------------
const analyzeIterations = (arr = []) => {
  // arr: [{ bestDistance: number }, ...]
  if (!arr || arr.length === 0) return null;
  const distances = arr.map(x => x.bestDistance);
  const minVal = Math.min(...distances);
  const minIndex = distances.indexOf(minVal);
  const lastVal = distances[distances.length - 1];
  // find when the algorithm first reached within 0.001 of final (practical convergence) — optional
  return {
    length: arr.length,
    minVal,
    minIndex,
    lastVal
  };
};

// ------------------------
// Component (UI + explanations inside the app)
// ------------------------
const EvaluationComponent = ({ evaluationData = {} }) => {
  const aco = evaluationData.aco || {};
  const beam = evaluationData.beam || {};

  // Precompute useful stats for automated explanations
  const acoStats = useMemo(() => analyzeIterations(aco.bestPerIteration || []), [aco.bestPerIteration]);
  const beamStats = useMemo(() => analyzeIterations(beam.bestPerIteration || []), [beam.bestPerIteration]);

  // Final best distances (prefer iteration-derived values if available)
  const acoFinalDistance = acoStats ? acoStats.minVal : (aco.distance || null);
  const beamFinalDistance = beamStats ? beamStats.minVal : (beam.distance || null);

  // Determine winners per metric (lower = better for distances, time, memory, compute time)
  const winners = {
    distance: (acoFinalDistance != null && beamFinalDistance != null) ? (acoFinalDistance < beamFinalDistance ? 'ACO' : (beamFinalDistance < acoFinalDistance ? 'Beam ACO' : 'Tie')) : 'N/A',
    time: (aco.time != null && beam.time != null) ? (aco.time < beam.time ? 'ACO' : (beam.time < aco.time ? 'Beam ACO' : 'Tie')) : 'N/A',
    memory: (aco.memoryUsage != null && beam.memoryUsage != null) ? (aco.memoryUsage < beam.memoryUsage ? 'ACO' : (beam.memoryUsage < aco.memoryUsage ? 'Beam ACO' : 'Tie')) : 'N/A',
    computeTime: (aco.computationTime != null && beam.computationTime != null) ? (aco.computationTime < beam.computationTime ? 'ACO' : (beam.computationTime < aco.computationTime ? 'Beam ACO' : 'Tie')) : 'N/A'
  };

  // Compose quick insight text (safe, checks for missing data)
  const quickInsights = [];
  if (acoFinalDistance != null && beamFinalDistance != null) {
    const diff = Math.abs(acoFinalDistance - beamFinalDistance);
    const better = winners.distance === 'ACO' ? 'ACO' : winners.distance === 'Beam ACO' ? 'Beam ACO' : 'Neither (tie)';
    quickInsights.push(`${better} produced the shorter route by ${diff.toFixed(2)} (units same as input).`);
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

  if (aco.computationTime != null && beam.computationTime != null) {
    const fasterCompute = aco.computationTime < beam.computationTime ? 'ACO' : (beam.computationTime < aco.computationTime ? 'Beam ACO' : 'Tie');
    if (fasterCompute !== 'Tie') quickInsights.push(`${fasterCompute} required less computation time.`);
  }

  if (aco.memoryUsage != null && beam.memoryUsage != null) {
    const lighter = aco.memoryUsage < beam.memoryUsage ? 'ACO' : (beam.memoryUsage < aco.memoryUsage ? 'Beam ACO' : 'Tie');
    if (lighter !== 'Tie') quickInsights.push(`${lighter} had lower memory usage.`);
  }

  // Data for the chart 
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
                  {formatTime(aco.time)}
                  {winners.time === 'ACO' && <Badge bg="success" className="ms-2">Better</Badge>}
                </td>
                <td>
                  {formatTime(beam.time)}
                  {winners.time === 'Beam ACO' && <Badge bg="success" className="ms-2">Better</Badge>}
                </td>
              </tr>

              <tr>
                <td>Distance</td>
                <td>
                  {acoFinalDistance != null ? formatDistance(acoFinalDistance) : formatDistance(aco.distance)}
                  {winners.distance === 'ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}
                </td>
                <td>
                  {beamFinalDistance != null ? formatDistance(beamFinalDistance) : formatDistance(beam.distance)}
                  {winners.distance === 'Beam ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}
                </td>
              </tr>

              <tr>
                <td>Memory Usage</td>
                <td>
                  {formatMemory(aco.memoryUsage)}
                  {winners.memory === 'ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}
                </td>
                <td>
                  {formatMemory(beam.memoryUsage)}
                  {winners.memory === 'Beam ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}
                </td>
              </tr>

              <tr>
                <td>Computation Time</td>
                <td>
                  {formatComputeTime(aco.computationTime)}
                  {winners.computeTime === 'ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}
                </td>
                <td>
                  {formatComputeTime(beam.computationTime)}
                  {winners.computeTime === 'Beam ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}
                </td>
              </tr>
            </tbody>
          </Table>

          {/* Quick automated insights visible to the user immediately */}
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

      {/* Convergence chart + short explanation */}
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
              <YAxis
                label={{ value: 'Fitness Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <RechartsTooltip />
              <Legend />
              {beam.bestPerIteration && (
                <Line
                  type="monotone"
                  dataKey="BeamACO"
                  stroke="#1f77b4"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {aco.bestPerIteration && (
                <Line
                  type="monotone"
                  dataKey="ACO"
                  stroke="#2ca02c"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Short textual guide under the chart */}
          <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#333' }}>
            <strong>How to read this chart:</strong>
            <span className="ms-2">
              Each point shows the best route distance found up to that iteration. If a line falls quickly it means rapid improvement; if it flattens, the algorithm has converged.
            </span>
          </div>
        </Col>
      </Row>

      {/* Collapsible detailed explanation for thesis readers */}
      <Row className="mt-3">
        <Col>
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Detailed interpretation (click to expand)</Accordion.Header>
              <Accordion.Body>
                <h6>What each metric represents</h6>
                <ul>
                  <li><strong>Route Time:</strong> Estimated traversal time across stops (converted from minutes). Useful when route length alone isn't enough, real-world travel time can differ due to speed assumptions.</li>
                  <li><strong>Distance:</strong> Total route length. Lower values mean a shorter path and usually better optimization for TSP-like problems.</li>
                  <li><strong>Memory Usage:</strong> Approximate RAM consumed during algorithm execution. Relevant for scaling to larger problem sizes.</li>
                  <li><strong>Computation Time:</strong> Wall-clock time the algorithm needed to finish; important for practical deployment and responsiveness.</li>
                </ul>

                <h6>Automated comparison summary</h6>
                <p>
                  This section programmatically compares final values and iteration behavior for ACO vs Beam-ACO:
                </p>
                <ul>
                  <li>
                    <strong>Final best distances:</strong> {acoFinalDistance != null ? `${acoFinalDistance.toFixed(2)}` : 'N/A'} (ACO) vs {beamFinalDistance != null ? `${beamFinalDistance.toFixed(2)}` : 'N/A'} (Beam ACO).
                    {winners.distance !== 'N/A' && winners.distance !== 'Tie' ? (
                      <span className="ms-2"><Badge bg="info">{winners.distance} better (distance)</Badge></span>
                    ) : winners.distance === 'Tie' ? <span className="ms-2"><Badge bg="secondary">Tie</Badge></span> : null}
                  </li>

                  <li>
                    <strong>Convergence speed:</strong> {acoStats && beamStats ? (
                      <span>
                        ACO best at iteration {acoStats.minIndex}, Beam ACO best at {beamStats.minIndex}. The algorithm with the lower index found its best solution earlier (faster convergence).
                      </span>
                    ) : <span>Insufficient iteration data to compute convergence speed.</span>}
                  </li>

                  <li>
                    <strong>Computation vs quality trade-off:</strong> Consider both "Computation Time" and "Distance" together; depending on the constraints (hardware, real-time requirements), a solution that slightly increases distance but faces notably greater computation costs might not be as acceptable.
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