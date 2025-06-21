import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../api/config';

const BeamMapComponent = ({ addMarker, markers, markerMode, paths, updateMarkerPosition, highlightedIndex, sequence }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const markerObjectsRef = useRef([]);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    const initializedMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [122.56, 13.41],  // Set the center to the Philippines
      zoom: 6,
      projection: 'mercator' // force flat map view
    });

    // Wait for the map style to fully load
    initializedMap.on('style.load', () => {
      setMap(initializedMap);
      initializedMap.dragRotate.disable();         // Disable rotation by dragging
      initializedMap.touchZoomRotate.disableRotation(); // Disable rotation by touch gestures
    });

    return () => initializedMap.remove();  // Clean up the map on unmount
  }, []);

  useEffect(() => {
    if (map) {
      const handleClick = async (e) => {
        if (markerMode) {
          const { lng, lat } = e.lngLat;
          // Log the lat and lng in the console
          console.log(`Latitude: ${lat}, Longitude: ${lng}`);
          addMarker(lat, lng);  // Allow placing markers on land or water
        }
      };

      map.on('click', handleClick);
      return () => map.off('click', handleClick);  // Clean up event listener
    }
  }, [map, addMarker, markerMode]);

  useEffect(() => {
    if (!map) return;
  
    // clear old markers…
    markerObjectsRef.current.forEach(m => m.remove());
    markerObjectsRef.current = [];
  
    // draw new markers…
    const newMarkers = markers.map(({ lat, lng }, idx) => {
      // find this marker's 1-based ID (idx+1) in the sequence:
      const pos = sequence.findIndex(id => id === idx+1);
      // display a 1-based "step number" from the route, or fallback to insertion order
      const label = pos >= 0 ? pos+1 : idx+1;
  
      const marker = new mapboxgl.Marker({ color: highlightedIndex===idx ? '#f00' : '#500073', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map)
        .on('dragend', () => {
          const { lat: newLat, lng: newLng } = marker.getLngLat();
          updateMarkerPosition(idx, newLat, newLng);
        });
  
      const el = document.createElement('div');
      el.className = 'marker-label';
      Object.assign(el.style, {
        position: 'absolute', top: '-20px', left: '-10px',
        background: '#FF5733', color: 'white', padding: '5px',
        borderRadius: '50%', fontWeight: 'bold', fontSize: '14px'
      });
      el.textContent = label;
      marker.getElement().appendChild(el);
  
      return marker;
    });
  
    markerObjectsRef.current = newMarkers;
  }, [map, markers, highlightedIndex, updateMarkerPosition, sequence]);  

  useEffect(() => {
    if (map && paths) {
      const source = map.getSource('path');
      
      // If paths are empty, clear the data
      if (paths.length === 0) {
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      } else {
        // If source exists, update the data
        if (source) {
          source.setData(paths);
        } else {
          // If the source doesn't exist, add it
          map.addSource('path', {
            type: 'geojson',
            data: paths,
          });
          map.addLayer({
            id: 'path',
            type: 'line',
            source: 'path',
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#0000FF', 
              'line-width': 4,
              'line-opacity': 0.9
            },
          });
        }
      }
    }
  }, [map, paths]); 

  return <div ref={mapContainerRef} style={{ height: '100%' }}></div>;
};

export default BeamMapComponent;