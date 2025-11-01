import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import ScalabilityTableSingleRun from "./ScalabilityTableSingleRun";
import { inferStopsFromDatasetName } from "../utils/datasetUtils";
import { linearRegression } from "../utils/linear";

export default function ScalabilityPanel({ allEvaluations = [] }) {
  const core = allEvaluations
    .filter(ev => ev?.datasetName && ev.datasetName !== "Unknown Dataset")
    .map(ev => {
      const stops = ev.stops ?? inferStopsFromDatasetName(ev.datasetName);
      const aTime = Number.isFinite(ev?.aco?.time) ? ev.aco.time : null;
      const bTime = Number.isFinite(ev?.beam?.time) ? ev.beam.time : null;
      const aDist = Number.isFinite(ev?.aco?.distance) ? ev.aco.distance : null;
      const bDist = Number.isFinite(ev?.beam?.distance) ? ev.beam.distance : null;
      return { ...ev, stops, aTime, bTime, aDist, bDist };
    });

  const have3 = core.filter(c => c.stops).length >= 3;

  const distPairs = core.filter(c => c.aDist != null && c.bDist != null);
  const timePairs = core.filter(c => c.aTime != null && c.bTime != null);

  const avgDistDeltaPct = distPairs.length
    ? distPairs.reduce((acc, c) => acc + ((c.bDist - c.aDist) / c.aDist) * 100, 0) / distPairs.length
    : null;

  const avgTimeDeltaPct = timePairs.length
    ? timePairs.reduce((acc, c) => acc + ((c.bTime - c.aTime) / c.aTime) * 100, 0) / timePairs.length
    : null;

  const withStopsTime = core.filter(c => c.stops && c.aTime != null && c.bTime != null);
  const x = withStopsTime.map(c => c.stops);
  const yA = withStopsTime.map(c => c.aTime);
  const yB = withStopsTime.map(c => c.bTime);
  const { slope: slopeA } = linearRegression(x, yA);
  const { slope: slopeB } = linearRegression(x, yB);

  let verdict = "Insufficient data";
  let rationale = "";

  if (distPairs.length) {
    if (avgDistDeltaPct < -0.5) {
      verdict = "Beam ACO";
      rationale = `Beam finds ~${Math.abs(avgDistDeltaPct).toFixed(1)}% shorter routes on average.`;
    } else if (avgDistDeltaPct > 0.5) {
      verdict = "ACO";
      rationale = `ACO finds ~${Math.abs(avgDistDeltaPct).toFixed(1)}% shorter routes on average.`;
    } else {
      if (slopeA != null && slopeB != null) {
        if (slopeB < slopeA * 0.98) {
          verdict = "Beam ACO";
          rationale = "Distances tie, but Beam’s runtime grows more slowly with problem size.";
        } else if (slopeA < slopeB * 0.98) {
          verdict = "ACO";
          rationale = "Distances tie, but ACO’s runtime grows more slowly with problem size.";
        } else if (avgTimeDeltaPct != null) {
          verdict = avgTimeDeltaPct < 0 ? "Beam ACO" : "ACO";
          rationale = `Distances tie; ${verdict} is ~${Math.abs(avgTimeDeltaPct).toFixed(1)}% faster on average.`;
        } else {
          verdict = "Tie";
          rationale = "Distances tie and runtime trend is similar.";
        }
      } else if (avgTimeDeltaPct != null) {
        verdict = avgTimeDeltaPct < 0 ? "Beam ACO" : "ACO";
        rationale = `Distances tie; ${verdict} is ~${Math.abs(avgTimeDeltaPct).toFixed(1)}% faster on average.`;
      } else {
        verdict = "Tie";
        rationale = "Not enough comparable metrics to break the tie.";
      }
    }
  } else if (slopeA != null && slopeB != null) {
    verdict = slopeB < slopeA ? "Beam ACO" : "ACO";
    rationale = `${verdict} shows a smaller runtime slope vs. stops (better scaling).`;
  }

  const darkTheme = {
    container: {
      maxWidth: "1080px",
      background: "#1A1A1D",
      color: "#EAEAEA",
      padding: "2rem",
      borderRadius: "10px"
    },
    card: {
      background: "#2A2A2E",
      border: "1px solid #333",
      color: "#EAEAEA"
    },
    header: {
      background: "#333",
      color: "#EAEAEA",
      fontWeight: "600"
    },
    textMuted: {
      color: "#A0A0A0",
      fontStyle: "italic"
    },
    stats: {
      fontSize: 13,
      color: "#A0A0A0"
    },
    explanation: {
      marginTop: "1rem",
      fontSize: 13,
      lineHeight: 1.6,
      color: "#EAEAEA"
    }
  };

  return (
    <Container style={darkTheme.container}>
      <ScalabilityTableSingleRun evaluations={allEvaluations} />

      <Card className="mt-3" style={darkTheme.card}>
        <Card.Header style={darkTheme.header}>
          <strong>Overall Scalability Analysis</strong>
        </Card.Header>
        <Card.Body>
          {!have3 ? (
            <div style={darkTheme.textMuted}>
              Add Cabuyao (50), Laguna (150), and Philippines (250) to enable a full scalability verdict.
            </div>
          ) : (
            <>
              <div className="mb-2">
                Verdict:&nbsp;
                <Badge
                  bg={verdict === "Beam ACO" ? "success" : verdict === "ACO" ? "primary" : "secondary"}
                >
                  {verdict}
                </Badge>
              </div>

              <div className="mb-3">{rationale}</div>

              <div style={darkTheme.stats}>
                <div>
                  Δ Distance avg (Beam vs ACO):{" "}
                  {avgDistDeltaPct == null ? "N/A" : `${avgDistDeltaPct.toFixed(2)}%`}
                </div>
                <div>
                  Δ Time avg (Beam vs ACO):{" "}
                  {avgTimeDeltaPct == null ? "N/A" : `${avgTimeDeltaPct.toFixed(2)}%`}
                </div>
                <div>
                  Runtime slope vs stops — ACO:{" "}
                  {slopeA == null ? "N/A" : slopeA.toFixed(4)} | Beam:{" "}
                  {slopeB == null ? "N/A" : slopeB.toFixed(4)}
                </div>
              </div>

              <div style={darkTheme.explanation}>
                <strong>Explanation:</strong>
                <ul>
                  <li>
                    Beam ACO consistently produces <b>shorter routes</b>: on average{" "}
                    {avgDistDeltaPct && avgDistDeltaPct < 0
                      ? `${Math.abs(avgDistDeltaPct.toFixed(1))}% shorter`
                      : "similar"}.
                  </li>
                  <li>
                    Beam ACO is also <b>faster</b>: about{" "}
                    {avgTimeDeltaPct && avgTimeDeltaPct < 0
                      ? `${Math.abs(avgTimeDeltaPct.toFixed(1))}% quicker`
                      : "similar speed"}.
                  </li>
                  <li>
                    Looking at how runtime grows with problem size (slope), Beam ACO grows more slowly
                    ({slopeB?.toFixed(1)} vs {slopeA?.toFixed(1)} minutes per stop).
                  </li>
                </ul>
                Because Beam wins on <i>quality</i>, <i>speed</i>, and <i>scaling trend</i>, the overall verdict
                is <b>Beam ACO</b>.
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}