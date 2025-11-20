import Table from "react-bootstrap/Table";
import Container from "react-bootstrap/Container";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { formatTime, formatDistance, formatComputeTime } from "../utils/datasetUtils";

export default function ScalabilityTableSingleRun({ evaluations = [] }) {
  if (!evaluations.length) return null;

  const styles = {
    container: {
      background: "#1A1A1D",
      color: "#EAEAEA",
      padding: "1rem 1.25rem",
      borderRadius: "10px",
    },
    heading: {
      marginBottom: "0.5rem",
      fontWeight: 600,
      color: "#FFFFFF",
    },
    infoIcon: {
      marginLeft: 8,
      cursor: "pointer",
      color: "#BBBBBB",
    },
    table: {
      background: "#2A2A2E",
      color: "#EAEAEA",
      borderColor: "#333",
      fontSize: "0.95rem",
    },
    thead: {
      background: "#333",
      color: "#EAEAEA",
    },
    rowHover: {
      background: "#3A3A3F",
    },
  };

  return (
    <Container className="my-2" style={styles.container}>
      <h5 style={styles.heading}>
        Scalability Comparison
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id="tooltip-metrics">
              <div>
                This table compares how ACO and Beam ACO perform as the dataset size grows.
                <br />
                It shows travel time and route distance for each dataset.
                <br />
                An algorithm scales better if its performance degrades more slowly with larger problem sizes,
                producing shorter routes and lower times as the number of stops increases.
              </div>
            </Tooltip>
          }
        >
          <span style={styles.infoIcon}>ℹ️</span>
        </OverlayTrigger>
      </h5>

      <Table
        bordered
        hover
        responsive
        size="sm"
        className="table-dark"
        style={styles.table}
      >
        <thead style={styles.thead}>
          <tr>
            <th>Dataset</th>
            <th>ACO Route Time</th>
            <th>Beam ACO Route Time</th>
            <th>ACO Distance</th>
            <th>Beam ACO Distance</th>
            <th>ACO Computation Time</th>
            <th>Beam ACO Computation Time</th>
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
            const acoCompTime = Number.isFinite(aco.distance) ? formatComputeTime(aco.computationTime) : "N/A";
            const beamCompTime = Number.isFinite(beam.distance) ? formatComputeTime(beam.computationTime) : "N/A";

            return (
              <tr
                key={idx}
                onMouseEnter={(e) => (e.currentTarget.style.background = styles.rowHover.background)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td>{datasetName}</td>
                <td>{acoTime}</td>
                <td>{beamTime}</td>
                <td>{acoDist}</td>
                <td>{beamDist}</td>
                <td>{acoCompTime}</td>
                <td>{beamCompTime}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Container>
  );
}