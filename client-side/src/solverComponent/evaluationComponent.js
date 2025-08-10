import { Table, Container, Row, Col } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatTime = (minutes) => {
  if (minutes == null) return 'N/A';
  const totalSeconds = minutes * 60;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
};

const formatDistance = (meters) => {
  if (meters == null) return 'N/A';
  return `${meters.toFixed(2)} km`;
};

const formatMemory = (bytes) => {
  if (bytes == null) return 'N/A';
  return `${(Math.abs(bytes) / 1024).toFixed(2)} KB`;
};

const formatComputeTime = (ms) => {
  if (ms == null) return 'N/A';
  return `${(ms / 1000).toFixed(2)} s`;
};

const mergeChartData = (acoDataRaw = [], beamDataRaw = []) => {
  const maxLength = Math.max(acoDataRaw.length, beamDataRaw.length);
  const data = [];

  for (let i = 0; i < maxLength; i++) {
    const acoScore =
      acoDataRaw[i] != null
        ? acoDataRaw[i].bestDistance
        : null;

    const beamScore =
      beamDataRaw[i] != null
        ? beamDataRaw[i].bestDistance
        : null;

    data.push({
      iteration: i,
      ACO: acoScore != null ? parseFloat(acoScore.toFixed(2)) : null,
      BeamACO: beamScore != null ? parseFloat(beamScore.toFixed(2)) : null
    });
  }

  return data;
};

const EvaluationComponent = ({ evaluationData }) => {
  const aco = evaluationData.aco || {};
  const beam = evaluationData.beam || {};

  return (
    <Container style={{ padding: '4rem', maxWidth: '1080px', background: '#FFFAFA' }}>
      <Row className="mb-4">
        <Col md={12}>
            <h5 style={{ marginBottom: '1rem', fontWeight: 500 }}>Evaluation Summary</h5>

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
                  <td>{formatTime(aco.time)}</td>
                  <td>{formatTime(beam.time)}</td>
                </tr>
                <tr>
                  <td>Distance</td>
                  <td>{formatDistance(aco.distance)}</td>
                  <td>{formatDistance(beam.distance)}</td>
                </tr>
                <tr>
                  <td>Memory Usage</td>
                  <td>{formatMemory(aco.memoryUsage)}</td>
                  <td>{formatMemory(beam.memoryUsage)}</td>
                </tr>
                <tr>
                  <td>Computation Time</td>
                  <td>{formatComputeTime(aco.computationTime)}</td>
                  <td>{formatComputeTime(beam.computationTime)}</td>
                </tr>
              </tbody>
            </Table>
        </Col>
      </Row>

      <Row>
        <Col md={12} style={{ height: 350 , padding: '0 1rem' }}>
            <h5 style={{ marginBottom: '1rem', fontWeight: 500 }}>Convergence Over Iterations</h5>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mergeChartData(aco.bestPerIteration, beam.bestPerIteration)}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="iteration" />
                  <YAxis
                    label={{
                      value: 'Fitness Score',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip />
                  <Legend />
                    {beam.bestPerIteration && (
                      <Line
                        type="monotone"
                        dataKey="BeamACO"
                        stroke="#1f77b4"
                        strokeWidth={2}
                        dot={({ index, cx, cy }) =>
                          index === aco.bestPerIteration.length - 1 ? (
                            <circle cx={cx} cy={cy} r={5} stroke="green" strokeWidth={2} fill="#fff"/>
                          ) : null
                        }
                      />
                    )}
                    {aco.bestPerIteration && (
                      <Line
                        type="monotone"
                        dataKey="ACO"
                        stroke="#2ca02c"
                        strokeWidth={2}
                        dot={({ index, cx, cy }) =>
                          index === aco.bestPerIteration.length - 1 ? (
                            <circle cx={cx} cy={cy} r={5} stroke="green" strokeWidth={2} fill="#fff"/>
                          ) : null
                        }
                      />
                    )}
                </LineChart>
              </ResponsiveContainer>
        </Col>
      </Row>
    </Container>
  );
};

export default EvaluationComponent;