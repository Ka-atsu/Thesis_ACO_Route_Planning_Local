// components/ScalabilityTableSingleRun.jsx
import { Table, Container } from "react-bootstrap";
import { formatTime, formatDistance } from "../utils/datasetUtils";

export default function ScalabilityTableSingleRun({ evaluations = [] }) {
  if (!evaluations.length) return null;

  return (
    <Container className="my-2">
      <h6>Scalability Comparison</h6>
      <Table bordered hover responsive size="sm">
        <thead className="table-light">
          <tr>
            <th>Dataset</th>
            <th>ACO Route Time</th>
            <th>Beam ACO Route Time</th>
            <th>ACO Distance</th>
            <th>Beam ACO Distance</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((ev, idx) => {
           if (!ev.datasetName || ev.datasetName === "Unknown Dataset") return null;
           const { datasetName, aco = {}, beam = {} } = ev;

            const acoTime = Number.isFinite(aco.time) ? formatTime(aco.time) : "N/A";
            const beamTime = Number.isFinite(beam.time) ? formatTime(beam.time) : "N/A";
            const acoDist = Number.isFinite(aco.distance) ? formatDistance(aco.distance) : "N/A";
            const beamDist = Number.isFinite(beam.distance) ? formatDistance(beam.distance) : "N/A";

            return (
              <tr key={idx}>
                <td>{datasetName}</td>
                <td>{acoTime}</td>
                <td>{beamTime}</td>
                <td>{acoDist}</td>
                <td>{beamDist}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
}
