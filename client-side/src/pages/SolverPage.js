import { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import { saveRoute, loadRoute, deleteRoute } from '../functions/pinSaveManagement';
import { predefinedRoutes } from '../functions/predefinedRoutes';
import useTspSolver from '../hooks/useTspSolver';
import DesktopLayout from './solverLayout/desktopLayout';

function SolverPage() {
  const [markers, setMarkers] = useState([]);
  const [markerMode, setMarkerMode] = useState(false);

  const [routes, setRoutes] = useState({ aco: [], beam: [] });
  const [routeSequences, setRouteSequences] = useState({ aco: [], beam: [] });

  const [estimatedTime, setEstimatedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [transportMode, setTransportMode] = useState('driving');

  const [savedRoutes, setSavedRoutes] = useState([]);

  const [activePanel, setActivePanel] = useState('info');
  const [activePanelMap, setActivePanelMap] = useState('map'); 

  const [evaluationData, setEvaluationData] = useState({}); 
  const [allEvaluations, setAllEvaluations] = useState([]);

  const [solveLocked, setSolveLocked] = useState(false);

  // Load saved markers and routes from localStorage
  useEffect(() => {
    const storedMarkers = localStorage.getItem('markers');
    if (storedMarkers) setMarkers(JSON.parse(storedMarkers));

    const storedRoutes = localStorage.getItem('savedRoutes');
    if (storedRoutes) setSavedRoutes(JSON.parse(storedRoutes));
  }, []);

  useEffect(() => {
    if (!evaluationData) return;

    setAllEvaluations(prev => {
      const i = prev.findIndex(e => e.datasetName === evaluationData.datasetName);
      if (i === -1) {
        // add new dataset evaluation
        return [...prev, evaluationData];
      } else {
        // update existing dataset evaluation
        const copy = [...prev];
        copy[i] = evaluationData;
        return copy;
      }
    });
  }, [evaluationData]);

  // Re-solve route when transport mode changes and TSP was solved
  useEffect(() => {
    if (solveLocked) solveTSP();
    // eslint-disable-next-line 
  }, [transportMode, solveLocked]);

  // Hook to handle TSP solving logic
  const { solveTSP, isTSPSolved  } = useTspSolver({
    markers,
    transportMode,
    setRoutes,
    setRouteSequences,
    setEvaluationData,
  });

  const handleSolve = async () => {
    await solveTSP();
    setSolveLocked(true);
  };

  // Handle removing a marker
  const handleRemoveMarker = () => {
    const updatedMarkers = markers.slice(0, -1);
    setMarkers(updatedMarkers);
    setRouteSequences({ aco: [], beam: [] });
    setRoutes([]);
    setDistance(0);
    setEstimatedTime(0);
    setEvaluationData([]);
    setSolveLocked(false);
  };

  // Handle resetting markers
  const handleResetMarkers = () => {
    setMarkers([]);  
    setRoutes([]);
    setRouteSequences({ aco: [], beam: [] });
    setDistance(0);
    setEstimatedTime(0);
    setEvaluationData([]);
    setSolveLocked(false);
    localStorage.removeItem('markers');
  };

  // Check if a route is predefined to prevent deletion
  const isPredefinedRoute = (route) => {
    return predefinedRoutes.some(predefinedRoute => predefinedRoute.name === route.name);
  };  

  // Combine saved routes with predefined routes for display
  const allRoutes = [...savedRoutes, ...predefinedRoutes.map(route => ({ ...route, isPredefined: true }))];

  // Function to load a route and update markers and paths
  const handleLoadRoute = (route) => {
    loadRoute(route, setMarkers);
    setRoutes([]);
    setRouteSequences({ aco: [], beam: [] });
    setDistance(0);
    setEstimatedTime(0);
    setEvaluationData([]);
    setSolveLocked(false);
    localStorage.removeItem('markers');
  };

  // Function to save the current route
  const handleSaveRoute = () => {
    saveRoute(markers, savedRoutes, setSavedRoutes);
  };

  // Function to delete a route, prevent deleting predefined ones
  const handleDeleteRoute = (index) => {
    const route = savedRoutes[index];
    if (!isPredefinedRoute(route)) {
      deleteRoute(index, savedRoutes, setSavedRoutes);
    } else {
      alert("This predefined route cannot be deleted.");
    }
  };

  return (
    <Container fluid style={{ background: '#FFFAFA' }}>
        <DesktopLayout
          markers={markers}
          setMarkers={setMarkers}
          markerMode={markerMode}
          setMarkerMode={setMarkerMode}
          solveTSP={handleSolve}
          solveLocked={solveLocked}
          isTSPSolved={isTSPSolved}
          setSolveLocked={setSolveLocked}
          distance={distance}
          estimatedTime={estimatedTime}
          transportMode={transportMode}
          allRoutes={allRoutes}
          routes={routes}
          routeSequences={routeSequences}
          evaluationData={evaluationData}
          allEvaluations={allEvaluations} 
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          activePanelMap={activePanelMap}
          setActivePanelMap={setActivePanelMap}
          handleDeleteRoute={handleDeleteRoute}
          handleLoadRoute={handleLoadRoute}
          handleResetMarkers={handleResetMarkers}
          handleRemoveMarker={handleRemoveMarker}
          handleSaveRoute={handleSaveRoute}
          setTransportMode={setTransportMode}
        />
    </Container>
  );
}

export default SolverPage;