import AcoMapComponent from '../../solverComponent/AcoMapComponent';
import BeamAcoMapComponent from '../../solverComponent/BeamAcoMapComponent';
import InfoPanel from '../../solverComponent/InfoPanel';
import SavedRoutesPanel from '../../solverComponent/SavedRoutesPanel';
import EvaluationComponent from '../../solverComponent/evaluationComponent';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import { FaInfoCircle, FaMapPin } from 'react-icons/fa';
import { FaMapLocationDot } from "react-icons/fa6";
import { ImStatsBars } from "react-icons/im";

function DesktopLayout({
    markers,
    setMarkers,
    markerMode,
    setMarkerMode,
    solveTSP,
    distance,
    estimatedTime,
    transportMode,
    allRoutes,
    routes,
    routeSequences,
    evaluationData,
    activePanel,
    setActivePanel,
    activePanelMap,
    setActivePanelMap,
    handleDeleteRoute,
    handleLoadRoute,
    handleResetMarkers,
    handleRemoveMarker,
    handleSaveRoute,
    setTransportMode
}) {
    return (
        <Row style={{ height: '100vh' }}>
          {/* Info Panel */}
          <Col xs={12} md={2} style={{ padding: '20px', background: '#1A1A1D', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Container style={{ flexGrow: 1 }}>
              {activePanel === 'info' ? (
                <InfoPanel
                  markers={markers}
                  markerMode={markerMode}
                  toggleMarkerMode={() => setMarkerMode(!markerMode)}
                  solveTSP={solveTSP}
                  distance={distance} 
                  estimatedTime={estimatedTime} 
                  removeMarker={handleRemoveMarker}
                  resetMarkers={handleResetMarkers}
                  transportMode={transportMode}
                  changeTransportMode={setTransportMode}
                />
              ) : (
                <SavedRoutesPanel
                  savedRoutes={allRoutes}
                  loadRoute={handleLoadRoute}
                  saveRoute={handleSaveRoute}
                  deleteRoute={handleDeleteRoute}
                />
              )}
            </Container>

            <Container style={{ textAlign: 'center' }}>
              <Button
                className="m-1"
                variant={activePanel === 'info' ? 'light' : 'secondary'}
                onClick={() => setActivePanel('info')}
                style={{ marginRight: '0.5rem' }}
              >
                <FaInfoCircle />
              </Button>
              <Button
                className="m-1"
                variant={activePanel === 'savedRoutes' ? 'light' : 'secondary'}
                onClick={() => setActivePanel('savedRoutes')}
                style={{ marginRight: '0.5rem' }}
              >
                <FaMapPin />
              </Button>
              <Button
                className="m-1"
                variant={activePanelMap === 'map' ? 'light' : 'secondary'}
                onClick={() => setActivePanelMap('map')}
                style={{ marginRight: '10px' }}
              >
                <FaMapLocationDot />
              </Button>
              <Button
                className="m-1"
                variant={activePanelMap === 'evaluation' ? 'light' : 'secondary'}
                onClick={() => setActivePanelMap('evaluation')}
                style={{ marginRight: '0.5rem' }}
              >
                <ImStatsBars />
              </Button>
            </Container>
          </Col>

          <Col xs={12} md={10} style={{ padding: 0 }}>
            {activePanelMap === 'map' ? (
              <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' , background: '#1A1A1D'}}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px' , color: '#ffffff' }}>ACO</div>
                    <div style={{ flex: 1 }}>
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
                            return updated;
                          });
                        }}
                      />
                    </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' , background: '#1A1A1D'}}>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '5px' , color: '#ffffff' }}>ACO + Beam Search</div>
                    <div style={{ flex: 1 }}>
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
                        }}
                      />
                    </div>
                </div>
              </div>
              ) : (
              <div style={{ padding: '20px', background: '#FFFAFA', height: '100%' }}>
                <EvaluationComponent evaluationData={evaluationData} />
              </div>
            )}
          </Col>
        </Row>
    );
}

export default DesktopLayout;