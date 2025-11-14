import { useRef } from 'react';
import AcoMapComponent from '../../solverComponent/AcoMapComponent';
import BeamAcoMapComponent from '../../solverComponent/BeamAcoMapComponent';
import InfoPanel from '../../solverComponent/InfoPanel';
import SavedRoutesPanel from '../../solverComponent/SavedRoutesPanel';
import EvaluationComponent from '../../solverComponent/evaluationComponent';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { FaMapLocationDot } from "react-icons/fa6";
import { ImStatsBars } from "react-icons/im";
import ScalabilityPanel from '../../solverComponent/ScalabilityPanel';

function DesktopLayout({
  markers,
  setMarkers,
  markerMode,
  setMarkerMode,
  solveTSP,
  isTSPSolved,
  solveLocked,
  setSolveLocked,
  distance,
  estimatedTime,
  transportMode,
  allRoutes,
  routes,
  routeSequences,
  evaluationData,
  allEvaluations,
  handleDeleteRoute,
  handleLoadRoute,
  handleResetMarkers,
  handleRemoveMarker,
  handleSaveRoute,
  setTransportMode
}) {
  // anchors for smooth scroll
  const containerRef = useRef(null);
  const mapsRef = useRef(null);
  const evalRef = useRef(null);

  const scrollTo = (ref) => {
    if (!containerRef.current || !ref.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    const targetTop = ref.current.getBoundingClientRect().top;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollTop + (targetTop - containerTop),
      behavior: 'smooth'
    });
  };

  return (
    <Row style={{ height: '100vh' }}>
      {/* Left sidebar */}
      <Col
        xs={12}
        md={2}
        style={{
          padding: '20px',
          background: '#1A1A1D',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Container style={{ flexGrow: 1 }}>
          <InfoPanel
            markers={markers}
            markerMode={markerMode}
            toggleMarkerMode={() => setMarkerMode(!markerMode)}
            solveTSP={solveTSP}
            isTSPSolved={isTSPSolved} 
            solveLocked={solveLocked}
            distance={distance}
            estimatedTime={estimatedTime}
            removeMarker={handleRemoveMarker}
            resetMarkers={handleResetMarkers}
            transportMode={transportMode}
            changeTransportMode={setTransportMode}
          />

          <SavedRoutesPanel
            savedRoutes={allRoutes}
            loadRoute={handleLoadRoute}
            saveRoute={handleSaveRoute}
            deleteRoute={handleDeleteRoute}
          />
        </Container>

        {/* Section jump buttons */}
        <Container style={{ textAlign: 'center' }}>
          <Button
            className="m-1"
            variant="light"
            onClick={() => scrollTo(mapsRef)}
            style={{ marginRight: '10px' }}
            title="Jump to Maps"
          >
            <FaMapLocationDot />
          </Button>
          <Button
            className="m-1"
            variant="secondary"
            onClick={() => scrollTo(evalRef)}
            style={{ marginRight: '0.5rem' }}
            title="Jump to Evaluation"
          >
            <ImStatsBars />
          </Button>
        </Container>
      </Col>

      {/* Right content column: scrollable */}
      <Col
        xs={12}
        md={10}
        style={{
          padding: 0,
          height: '100vh',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
          background: '#1A1A1D'
        }}
        ref={containerRef}
      >
        {/* MAPS SECTION */}
        <section ref={mapsRef}>
          <div style={{ display: 'flex', width: '100%', height: '80vh' }}>
            {/* ACO Map Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1A1A1D' }}>
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  padding: '8px',
                  color: '#ffffff'
                }}
              >
                ACO
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <AcoMapComponent
                  sequence={routeSequences.aco}
                  addMarker={(lat, lng) => {
                    if (markerMode) setMarkers(prev => [...prev, { lat, lng }]);
                  }}
                  markers={markers}
                  markerMode={markerMode}
                  paths={routes.aco || []}
                  updateMarkerPosition={(index, newLat, newLng) => {
                    setMarkers(prev => {
                      const updated = [...prev];
                      updated[index] = { lat: newLat, lng: newLng };
                      console.log(JSON.stringify(updated, null, 2));
                      return updated;
                    });
                    setSolveLocked(false);
                  }}
                />
              </div>
            </div>

            {/* Divider Line */}
            <div
              aria-hidden="true"
              style={{
                width: '0.5px',
                background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15) 15%, rgba(255,255,255,0.15) 85%, transparent)',
                margin: '0 2px',
                alignSelf: 'stretch'
              }}
            />

            {/* Beam-ACO Map Column */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#1A1A1D'
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  padding: '8px',
                  color: '#ffffff'
                }}
              >
                ACO + Beam Search
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <BeamAcoMapComponent
                  sequence={routeSequences.beam}
                  addMarker={(lat, lng) => {
                    if (markerMode) setMarkers(prev => [...prev, { lat, lng }]);
                  }}
                  markers={markers}
                  markerMode={markerMode}
                  paths={routes.beam || []}
                  updateMarkerPosition={(index, newLat, newLng) => {
                    setMarkers(prev => {
                      const updated = [...prev];
                      updated[index] = { lat: newLat, lng: newLng };
                      return updated;
                    });
                    setSolveLocked(false);
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* EVALUATION SECTION */}
        <section
          ref={evalRef}
          style={{ background: '#1A1A1D', padding: '20px', minHeight: '20vh' }}
        >
          <EvaluationComponent evaluationData={evaluationData} />
          <ScalabilityPanel allEvaluations={allEvaluations} />
        </section>
      </Col>
    </Row>
  );
}

export default DesktopLayout;