// components/ScalabilityTableSingleRun.jsx
import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip"
import { formatTime, formatDistance } from "../utils/datasetUtils";

export default function ScalabilityTableSingleRun({ evaluations = [] }) {
  if (!evaluations.length) return null;

  return (
    <Container className="my-2">
      <h5 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
        Scalability Comparison
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id="tooltip-metrics">
              This table compares how ACO and Beam ACO perform as the dataset size grows.
              <br />
              It shows travel time and route distance for each dataset.
              <br />
              An algorithm scales better if its performance degrades more slowly with larger problem sizes,
              <br />
              producing shorter routes and lower times as the number of stops increases.
            </Tooltip>
          }
        >
          <span style={{ marginLeft: 8, cursor: 'pointer', color: '#6c757d' }}>ℹ️</span>
        </OverlayTrigger>
      </h5>

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