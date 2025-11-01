import { useMemo } from 'react';
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import Card from "react-bootstrap/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistance, formatComputeTime, formatMemory, formatTime , toBytes, toKilometers, toMillis, toMinutes, mergeChartData, analyzeIterations } from '../utils/datasetUtils';

const EvaluationComponent = ({ evaluationData = {} }) => {
  const aco = evaluationData.aco || {};
  const beam = evaluationData.beam || {};

  const acoTimeMin = useMemo(() => toMinutes(aco.time), [aco.time]);
  const beamTimeMin = useMemo(() => toMinutes(beam.time), [beam.time]);

  const acoDistKm = useMemo(() => (aco.distance != null ? toKilometers(aco.distance) : null), [aco.distance]);
  const beamDistKm = useMemo(() => (beam.distance != null ? toKilometers(beam.distance) : null), [beam.distance]);

  const acoMemBytes = useMemo(() => { const v = toBytes(aco.memoryUsage); return v == null ? v : Math.abs(v); }, [aco.memoryUsage]);
  const beamMemBytes = useMemo(() => { const v = toBytes(beam.memoryUsage); return v == null ? v : Math.abs(v); }, [beam.memoryUsage]);

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

  const darkStyles = {
    container: {
      padding: '2.5rem',
      maxWidth: '1080px',
      background: '#1A1A1D',
      color: '#EAEAEA',
      borderRadius: '10px',
    },
    card: {
      background: '#2A2A2E',
      border: '1px solid #333',
      color: '#EAEAEA'
    },
    table: {
      background: '#2A2A2E',
      color: '#EAEAEA',
    },
    header: {
      fontWeight: 600,
      color: '#FFFFFF',
    }
  };

  return (
    <Container style={darkStyles.container}>
      <Row className="mb-3">
        <Col>
          <h5 style={darkStyles.header}>
            Evaluation Summary
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="tooltip-metrics">This table shows core performance metrics. Lower values are better for time, distance, memory and computation time.</Tooltip>}
            >
              <span style={{ marginLeft: 8, cursor: 'pointer', color: '#BBBBBB' }}>ℹ️</span>
            </OverlayTrigger>
          </h5>

          <Table responsive bordered hover size="sm" style={darkStyles.table} className="table-dark">
            <thead style={{ background: '#333', color: '#EAEAEA' }}>
              <tr>
                <th>Metric</th>
                <th>ACO</th>
                <th>Beam ACO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Route Time</td>
                <td>{formatTime(acoTimeMin)}{winners.time === 'ACO' && <Badge bg="success" className="ms-2">Better</Badge>}</td>
                <td>{formatTime(beamTimeMin)}{winners.time === 'Beam ACO' && <Badge bg="success" className="ms-2">Better</Badge>}</td>
              </tr>
              <tr>
                <td>Distance</td>
                <td>{formatDistance(acoFinalDistance)}{winners.distance === 'ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}</td>
                <td>{formatDistance(beamFinalDistance)}{winners.distance === 'Beam ACO' && <Badge bg="success" className="ms-2">Shorter</Badge>}</td>
              </tr>
              <tr>
                <td>Memory Usage</td>
                <td>{formatMemory(acoMemBytes)}{winners.memory === 'ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}</td>
                <td>{formatMemory(beamMemBytes)}{winners.memory === 'Beam ACO' && <Badge bg="success" className="ms-2">Lower</Badge>}</td>
              </tr>
              <tr>
                <td>Computation Time</td>
                <td>{formatComputeTime(acoCompMs)}{winners.computeTime === 'ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}</td>
                <td>{formatComputeTime(beamCompMs)}{winners.computeTime === 'Beam ACO' && <Badge bg="success" className="ms-2">Faster</Badge>}</td>
              </tr>
            </tbody>
          </Table>

          <Card className="mb-3" style={darkStyles.card}>
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
          <h5 style={darkStyles.header}>
            Convergence Over Iterations
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="tooltip-convergence">This chart shows the best (lowest) route distance found at each iteration.</Tooltip>}
            >
              <span style={{ marginLeft: 8, cursor: 'pointer', color: '#BBBBBB' }}>ℹ️</span>
            </OverlayTrigger>
          </h5>

          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis dataKey="iteration" stroke="#EAEAEA" />
              <YAxis stroke="#EAEAEA" label={{ value: 'Route Distance (km)', angle: -90, position: 'insideLeft', fill: '#EAEAEA' }} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#2A2A2E', border: '1px solid #444', color: '#EAEAEA' }} />
              <Legend />
              {beam.bestPerIteration && <Line type="monotone" dataKey="BeamACO" stroke="#1f77b4" strokeWidth={2} dot={false} />}
              {aco.bestPerIteration && <Line type="monotone" dataKey="ACO" stroke="#2ca02c" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </Col>
      </Row>
    </Container>
  );
};

export default EvaluationComponent;