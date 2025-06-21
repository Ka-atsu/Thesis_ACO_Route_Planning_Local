

export const saveRoute = (markers, savedRoutes, setSavedRoutes) => {
    if (markers.length === 0) return;
    const routeName = prompt("Enter a name for this route:");
    if (!routeName) return;
    const newRoute = {
      name: routeName,
      markers: markers,
    };
    const updatedRoutes = [...savedRoutes, newRoute];
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
  };
  
  export const loadRoute = (route, setMarkers , setPaths , setPathsBeamAco) => {
    setMarkers(route.markers);
    setPaths([]);
    setPathsBeamAco([]);     
  };
  
  export const deleteRoute = (index, savedRoutes, setSavedRoutes) => {
    const updatedRoutes = savedRoutes.filter((_, i) => i !== index);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
  };
  