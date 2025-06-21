import { Table } from 'react-bootstrap';

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
  const km = meters;
  return `${km.toFixed(2)} km`;
};

const formatMemory = (bytes) => {
  if (bytes == null) return 'N/A';
  const kb = bytes / 1024; 
  return `${kb.toFixed(2)} KB`;
};

const formatComputeTime = (ms) => {
  if (ms == null) return 'N/A';
  const sec = ms / 1000;
  return `${sec.toFixed(2)} s`;
};

const EvaluationComponent = ({ evaluationData }) => {
  const aco = evaluationData.aco || {};
  const beam = evaluationData.beam || {};

  return (
    <div style={{ padding: '1rem' }}>
      <h4>Evaluation Results</h4>
      <Table bordered hover size="sm">
        <thead>
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
            <td>{formatMemory(aco.memoryUsage) ?? 'N/A'}</td>
            <td>{formatMemory(beam.memoryUsage) ?? 'N/A'}</td>
          </tr>
          <tr>
            <td>Computation Time</td>
            <td>{formatComputeTime(aco.computationTime)}</td>
            <td>{formatComputeTime(beam.computationTime)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default EvaluationComponent;