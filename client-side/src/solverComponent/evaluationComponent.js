import { useMemo } from 'react';
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Accordion from "react-bootstrap/Accordion";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Card from "react-bootstrap/Card";
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

import { formatDistance, formatComputeTime, formatMemory, formatTime , toBytes, toKilometers, toMillis, toMinutes, mergeChartData, analyzeIterations } from '../utils/datasetUtils';
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
              overlay={<Tooltip id="tooltip-metrics">This table shows core performance metrics. Lower values are better for time, distance, memory and computation time.</Tooltip>}
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
              overlay={<Tooltip id="tooltip-convergence">This chart shows the best (lowest) route distance the algorithm has found at each iteration. A lower line is better; steep drops show rapid improvement.</Tooltip>}
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