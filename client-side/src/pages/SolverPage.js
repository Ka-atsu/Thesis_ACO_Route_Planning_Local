import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaInfoCircle, FaMapPin } from 'react-icons/fa';
import { FaMapLocationDot } from "react-icons/fa6";
import { ImStatsBars } from "react-icons/im";
import MapComponent from '../solverComponent/AMapComponent';
import BeamMapComponent from '../solverComponent/BeamAcoMapComponent';
import InfoPanel from '../solverComponent/InfoPanel';
import SavedRoutesPanel from '../solverComponent/SavedRoutesPanel';
import EvaluationPanel from '../solverComponent/evaluationComponent';
import { saveRoute, loadRoute, deleteRoute } from '../functions/pinSaveManagement';
import { calculateDistanceMatrix } from '../utils/calculateDistanceMatrix';
import { getContinuousRoute, getContinuousRouteSplit } from '../utils/routeUtis';
import { MAPBOX_ACCESS_TOKEN } from '../api/config';
import { predefinedRoutes } from '../functions/predefinedRoutes';

function SolverPage() {
  const [markers, setMarkers] = useState([]);
  const [markerMode, setMarkerMode] = useState(false);

  const [paths, setPaths] = useState([]);
  const [pathsBeamAco, setPathsBeamAco] = useState([]);

  const [estimatedTime, setEstimatedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [transportMode, setTransportMode] = useState('driving');
  const [routeSequence, setRouteSequence] = useState([]);
  const [routeSequenceBeamAco, setRouteSequenceBeamAco] = useState([]);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [isTSPSolved, setIsTSPSolved] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState([]);

  const [locationNames, setLocationNames] = useState([]); 
  const [highlightedIndex, setHighlightedIndex] = useState(null);  
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line
  const [routeOptions, setRouteOptions] = useState(null);  

  const [activePanel, setActivePanel] = useState('info');
  const [activePanelMap, setactivePanelMap] = useState('map'); 

  const [evaluationData, setEvaluationData] = useState({}); 

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsMobile(true); // Mobile screen
      } else {
        setIsMobile(false); // Desktop screen
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const getLocationNames = async () => {
      const names = [];
      for (let index of routeSequence) {
        const marker = markers[index - 1]; // Use the index from routeSequence to find the corresponding marker
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${marker.lng},${marker.lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
        );
        const data = await response.json();
        // console.log("API Response:", data); // Log the response to inspect it
        const placeName = data.features[0]?.place_name || 'Unknown Location';
        names.push(placeName);
      }
      setLocationNames(names);
    };
  
    if (routeSequence.length > 0 && markers.length > 0) {  // Only fetch if routeSequence is available and markers are not empty
      getLocationNames();
    }
  }, [routeSequence, markers]);

  useEffect(() => {
    const storedMarkers = localStorage.getItem('markers');
    if (storedMarkers) setMarkers(JSON.parse(storedMarkers));

    const storedRoutes = localStorage.getItem('savedRoutes');
    if (storedRoutes) setSavedRoutes(JSON.parse(storedRoutes));

  }, []);

  
  // Re-solve route when transport mode changes (and TSP was solved)
  useEffect(() => {
    if (isTSPSolved) handleSolveTSP();
    // eslint-disable-next-line 
  }, [transportMode]);

  // Re-solve route when avoidTolls toggles and driving is active
  useEffect(() => {
    if (transportMode === 'driving' && isTSPSolved) handleSolveTSP();
    // eslint-disable-next-line 
  }, [avoidTolls]);

  // Reset avoidTolls when switching to non-driving modes
  useEffect(() => {
    if (transportMode !== 'driving' && avoidTolls) setAvoidTolls(false);
  }, [transportMode, avoidTolls]);

  const handleSolveTSP = async () => {
    if (markers.length < 2) {
      console.log('Need at least two markers to solve TSP');
      return;
    }
  
    const { distanceMatrix, durationMatrix } = await calculateDistanceMatrix(markers, transportMode);
    if (!distanceMatrix || !durationMatrix || distanceMatrix.length === 0) {
      console.error("Failed to retrieve valid distance matrix.");
      return;
    }
  
    // Track memory usage before the workers start
    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
    console.log(`Memory before workers: ${memoryBefore}`);
  
    const acoWorker = new Worker(new URL('../workers/acoWorker.js', import.meta.url));
    acoWorker.postMessage({ distanceMatrix, durationMatrix });
  
    const beamAcoWorker = new Worker(new URL('../workers/beamAcoWorker.js', import.meta.url));
    beamAcoWorker.postMessage({ distanceMatrix, durationMatrix });
  
    // Flags to check if both results are received
    let acoResultData = null;
    let beamAcoResultData = null;
    let memoryUsedAco = 0;
    let memoryUsedBeamAco = 0;
  
    // Function to process both results once both are available
    const processResults = async () => {
      if (!acoResultData || !beamAcoResultData) {
        console.log("Both results are not yet available.");
        return;
      }
  
      const acoClosedPath = [...acoResultData.bestPath, acoResultData.bestPath[0]]; // Closing the loop
      const beamAcoClosedPath = [...beamAcoResultData.bestPath, beamAcoResultData.bestPath[0]]; // Closing the loop
  
      let routeResults;
  
      // If either ACO or Beam ACO path is long, split it into smaller segments
      if (acoClosedPath.length > 20 || beamAcoClosedPath.length > 20) {
        console.log("Path is too long, splitting into smaller segments...");
  
        // Await the results of splitting the routes
        const acoRoutes = await getContinuousRouteSplit(acoClosedPath, markers, transportMode, avoidTolls);
        const beamAcoRoutes = await getContinuousRouteSplit(beamAcoClosedPath, markers, transportMode, avoidTolls);
  
        routeResults = { aco: acoRoutes, beam: beamAcoRoutes };
      } else {
        // Fetch the entire route if it's short enough
        const acoRoutes = await getContinuousRoute(acoClosedPath, markers, transportMode, avoidTolls);
        const beamAcoRoutes = await getContinuousRoute(beamAcoClosedPath, markers, transportMode, avoidTolls);
  
        routeResults = { aco: acoRoutes[0], beam: beamAcoRoutes[0] };
      }
  
      // Ensure we received valid routes
      if (!routeResults) {
        console.error("No valid routes returned from getContinuousRoute.");
        return;
      }
  
      // Save results to state
      setRouteOptions({
        aco: {
          routeTime: routeResults.aco.routeTime,
          routeDistance: routeResults.aco.routeDistance,
          geoJsonPath: routeResults.aco.geoJsonPath,
          routeSeq: acoClosedPath.map(index => index + 1),
        },
        beam: routeResults.beam ? {
          routeTime: routeResults.beam.routeTime,
          routeDistance: routeResults.beam.routeDistance,
          geoJsonPath: routeResults.beam.geoJsonPath,
          routeSeq: beamAcoClosedPath.map(index => index + 1),
        } : null,
      });
  
      // Update paths and sequences
      setPaths(routeResults.aco.geoJsonPath);
      setPathsBeamAco(routeResults.beam.geoJsonPath);
      setRouteSequence(acoClosedPath.map(index => index + 1));
      setRouteSequenceBeamAco(beamAcoClosedPath.map(index => index + 1));
  
      // Set the problem as solved
      setIsTSPSolved(true);
  
      // Set evaluation data
      setEvaluationData({
        aco: {
          time: acoResultData.bestPathDuration,
          distance: acoResultData.bestPathLength,
          bestPerIteration: acoResultData.bestSolutions,
          computationTime: acoResultData.computationTime,
          memoryUsage: memoryUsedAco,
        },
        beam: routeResults.beam ? {
          time: beamAcoResultData.bestPathDuration,
          distance: beamAcoResultData.bestPathLength,
          bestPerIteration: beamAcoResultData.bestSolutions,
          computationTime: beamAcoResultData.computationTime,
          memoryUsage: memoryUsedBeamAco,
        } : null,
      });
    };
  
    // Handling the result from ACO worker
    acoWorker.onmessage = async (event) => {
      const { acoResult } = event.data;
      console.log("Received acoResult:", acoResult);
  
      if (!acoResult) {
        console.error("No valid result obtained from ACO.");
        return;
      }
  
      // ACO is the best route, Beam ACO is the alternative
      const acoClosedPath = [...acoResult.bestPath, acoResult.bestPath[0]]; // Closing the loop
      console.log("ACO Closed Path:", acoClosedPath);
  
      // Track memory after ACO worker finishes
      const memoryAfterAco = performance.memory ? performance.memory.usedJSHeapSize : 0;
      console.log(`Memory after ACO worker: ${memoryAfterAco}`);
      memoryUsedAco = (memoryAfterAco - memoryBefore);
      console.log(`Memory used by ACO Worker: ${memoryUsedAco} KB`);
  
      // Store the result in acoResultData for later use
      acoResultData = acoResult;
  
      // If both results are available, process them
      processResults();
  
      acoWorker.terminate();
    };
  
    // Handling the result from Beam ACO worker
    beamAcoWorker.onmessage = async (event) => {
      const { beamAcoResult } = event.data;
      console.log("Received beamAcoResult:", beamAcoResult);
  
      if (!beamAcoResult) {
        console.error("No valid result obtained from Beam ACO.");
        return;
      }
  
      const beamAcoClosedPath = [...beamAcoResult.bestPath, beamAcoResult.bestPath[0]]; // Closing the loop
      console.log("Beam ACO Closed Path:", beamAcoClosedPath);
  
      // Track memory after Beam ACO worker finishes
      const memoryAfterBeamAco = performance.memory ? performance.memory.usedJSHeapSize : 0;
      memoryUsedBeamAco = (memoryAfterBeamAco - memoryBefore);
      console.log(`Memory used by Beam ACO Worker: ${memoryUsedBeamAco} KB`);
  
      // Store the result in beamAcoResultData for later use
      beamAcoResultData = beamAcoResult;
  
      // If both results are available, process them
      processResults();
  
      beamAcoWorker.terminate();
    };
  
    // Error handling for ACO worker
    acoWorker.onerror = (error) => {
      console.error("Error in ACO worker:", error.message);
    };
  
    // Error handling for Beam ACO worker
    beamAcoWorker.onerror = (error) => {
      console.error("Error in Beam ACO worker:", error.message);
    };
  };
  

  // Handle removing a marker
  const handleRemoveMarker = () => {
    const updatedMarkers = markers.slice(0, -1);
    setMarkers(updatedMarkers);
    setRouteSequence([]);
    setRouteSequenceBeamAco([]); 
    setPaths([]);
    setPathsBeamAco([]); 
    setDistance(0);
    setEstimatedTime(0);
    setLocationNames([]);
    setEvaluationData([]);
  };

  // Handle resetting markers
  const handleResetMarkers = () => {
    setMarkers([]);  
    setPaths([]);
    setPathsBeamAco([]);     
    setRouteSequence([]);
    setRouteSequenceBeamAco([]); 
    setLocationNames([]);
    setDistance(0);
    setEstimatedTime(0);
    setEvaluationData([]);
    localStorage.removeItem('markers');
  };

  const handleLocationClick = (index) => {
    const trueMarkerIndex = routeSequence[index] - 1;  
    setHighlightedIndex(trueMarkerIndex);  
  };

  const isPredefinedRoute = (route) => {
    return predefinedRoutes.some(predefinedRoute => predefinedRoute.name === route.name);
  };  

return (
    <Container fluid>
      {/* <Row style={{ height: '100vh' }}> */}
        {isMobile ? (
          <Row style={{ height: '100vh', flexDirection: 'column' }}>
            {/* Map on Top for Mobile */}
            <Col xs={12} style={{ padding: '0' , height: '50%'}}>
              <MapComponent
                highlightedIndex={highlightedIndex}
                addMarker={(lat, lng) => {
                    if (markerMode) {
                      setMarkers(prev => [...prev, { lat, lng }]);
                    }
                }}
                markers={markers}
                markerMode={markerMode}
                paths={paths}
                updateMarkerPosition={(index, newLat, newLng) => {
                  setMarkers(prev => {
                    const updated = [...prev];
                    updated[index] = { lat: newLat, lng: newLng };
                    return updated;
                  });
                }}
              />
            </Col>
            {/* Info Panel Below Map for Mobile */}
            <Col xs={12} style={{ padding: '1rem', background: '#1A1A1D' , overflow: 'auto' , maxHeight: '50%', justifySelf:'flex-end' }}>
            <div style={{ flexGrow: 1 }}>
            {activePanel === 'info' ? (
              <InfoPanel
                markers={markers}
                markerMode={markerMode}
                toggleMarkerMode={() => setMarkerMode(!markerMode)}
                solveTSP={handleSolveTSP}
                distance={distance} 
                estimatedTime={estimatedTime} 
                removeMarker={handleRemoveMarker}
                resetMarkers={handleResetMarkers}
                transportMode={transportMode}
                changeTransportMode={setTransportMode}
                routeSequence={routeSequence}
                avoidTolls={avoidTolls}
                setAvoidTolls={setAvoidTolls}
                locationNames={locationNames} 
                onLocationClick={handleLocationClick}
              />
            ) : (
              <SavedRoutesPanel
                savedRoutes={[...savedRoutes, ...predefinedRoutes]}
                loadRoute={(route) => loadRoute(route, setMarkers , setPaths , setPathsBeamAco)}
                saveRoute={() => saveRoute(markers, savedRoutes, setSavedRoutes)}
                deleteRoute={(index) => {
                  if (!isPredefinedRoute(savedRoutes[index])) {
                    deleteRoute(index, savedRoutes, setSavedRoutes);
                  } else {
                    alert("This predefined route cannot be deleted.");
                  }
                }}
              />
            )}
          </div>
              <div style={{ marginTop: '1rem', textAlign: 'center'  }}>
                <Button
                  variant={activePanel === 'info' ? 'light' : 'secondary'}
                  onClick={() => setActivePanel('info')}
                  style={{ marginRight: '10px' }}
                >
                  <FaInfoCircle />
                </Button>
                <Button
                  variant={activePanel === 'savedRoutes' ? 'light' : 'secondary'}
                  onClick={() => setActivePanel('savedRoutes')}
                >
                  <FaMapPin />
                </Button>
              </div>
            </Col>
          </Row>
        ) : (
          <Row style={{ height: '100vh' }}>
            {/* Info Panel on Left for Desktop */}
            <Col xs={12} md={2} style={{ padding: '20px', background: '#1A1A1D', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ flexGrow: 1 }}>
            {activePanel === 'info' ? (
              <InfoPanel
                markers={markers}
                markerMode={markerMode}
                toggleMarkerMode={() => setMarkerMode(!markerMode)}
                solveTSP={handleSolveTSP}
                distance={distance} 
                estimatedTime={estimatedTime} 
                removeMarker={handleRemoveMarker}
                resetMarkers={handleResetMarkers}
                transportMode={transportMode}
                changeTransportMode={setTransportMode}
                routeSequence={routeSequence}
                avoidTolls={avoidTolls}
                setAvoidTolls={setAvoidTolls}
                locationNames={locationNames} 
                onLocationClick={handleLocationClick}
              />
            ) : (
              <SavedRoutesPanel
                savedRoutes={[...savedRoutes, ...predefinedRoutes]}
                loadRoute={(route) => loadRoute(route, setMarkers, setPaths , setPathsBeamAco)}
                saveRoute={() => saveRoute(markers, savedRoutes, setSavedRoutes)}
                deleteRoute={(index) => {
                  if (!isPredefinedRoute(savedRoutes[index])) {
                    deleteRoute(index, savedRoutes, setSavedRoutes);
                  } else {
                    alert("This predefined route cannot be deleted.");
                  }
                }}
              />
            )}
          </div>
            <div style={{ textAlign: 'center' }}>
              <Button
                variant={activePanel === 'info' ? 'light' : 'secondary'}
                onClick={() => setActivePanel('info')}
                style={{ marginRight: '0.5rem' }}
              >
                <FaInfoCircle />
              </Button>
              <Button
                variant={activePanel === 'savedRoutes' ? 'light' : 'secondary'}
                onClick={() => setActivePanel('savedRoutes')}
                style={{ marginRight: '0.5rem' }}
              >
                <FaMapPin />
              </Button>
              <Button
                variant={activePanelMap === 'map' ? 'light' : 'secondary'}
                onClick={() => setactivePanelMap('map')}
                style={{ marginRight: '10px' }}
              >
                <FaMapLocationDot />
              </Button>
              <Button
                variant={activePanelMap === 'evaluation' ? 'light' : 'secondary'}
                onClick={() => setactivePanelMap('evaluation')}
                style={{ marginRight: '0.5rem' }}
              >
                <ImStatsBars />
              </Button>
            </div>
            </Col>

            <Col xs={12} md={10} style={{ padding: 0 }}>
            {activePanelMap === 'map' ? (
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* ACO result */}
                <div style={{ flex: 1 }}>
                  <MapComponent
                    // highlightedIndex={highlightedIndex}
                    sequence={routeSequence}
                    addMarker={(lat, lng) => {
                      if (markerMode) setMarkers(prev => [...prev, { lat, lng }]);
                    }}
                    markers={markers}
                    markerMode={markerMode}
                    paths={paths || []}
                    updateMarkerPosition={(index, newLat, newLng) => {
                    setMarkers(prev => {
                      const updated = [...prev];
                      updated[index] = { lat: newLat, lng: newLng };
                      return updated;
                    });
                  }}
                  />
                </div>

                {/* Beam-ACO result */}
                <div style={{ flex: 1 }}>
                  <BeamMapComponent
                    // highlightedIndex={highlightedIndex}
                    sequence={routeSequenceBeamAco}
                    addMarker={(lat, lng) => {
                      if (markerMode) setMarkers(prev => [...prev, { lat, lng }]);
                    }}
                    markers={markers}
                    markerMode={markerMode}
                    paths={pathsBeamAco || []}
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
               ) : (
                <EvaluationPanel evaluationData={evaluationData} />
              )}
            </Col>
          </Row>
        )}
    </Container>
  );
}

export default SolverPage;