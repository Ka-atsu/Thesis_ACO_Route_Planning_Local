import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapComponent = ({ addMarker, markers, markerMode, paths, updateMarkerPosition, highlightedIndex, sequence }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const markerObjectsRef = useRef([]);

  useEffect(() => {
    const initializedMap = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'http://localhost:8080/styles/basic-preview/style.json',
      center: [122.56, 13.41],
      zoom: 6,
      projection: 'mercator'
    });

    initializedMap.on('style.load', () => {
      setMap(initializedMap);
      initializedMap.dragRotate.disable();
      initializedMap.touchZoomRotate.disableRotation();
    });

    return () => initializedMap.remove();
  }, []);

  useEffect(() => {
    if (map) {
      const handleClick = (e) => {
        if (markerMode) {
          const { lng, lat } = e.lngLat;
          console.log(`Latitude: ${lat}, Longitude: ${lng}`);
          addMarker(lat, lng);
        }
      };

      map.on('click', handleClick);
      return () => map.off('click', handleClick);
    }
  }, [map, addMarker, markerMode]);

useEffect(() => {
  if (!map) return;

  // Clear old marker instances
  markerObjectsRef.current.forEach(marker => {
    if (marker && typeof marker.remove === 'function') {
      marker.remove();
    } else {
      console.warn('Marker object missing remove method:', marker);
    }
  });
  markerObjectsRef.current = [];

  // Create new marker instances
  const newMarkers = markers.map(({ lat, lng }, idx) => {
    const pos = sequence.findIndex(id => id === idx + 1);
    const label = pos >= 0 ? pos + 1 : idx + 1;

    const el = document.createElement('div');
    el.className = 'marker-label';
    Object.assign(el.style, {
      background: highlightedIndex === idx ? '#f00' : '#500073',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer'
    });
    el.textContent = label;

    const marker = new maplibregl.Marker({
      element: el,
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map);

    marker.on('dragend', () => {
      const { lat: newLat, lng: newLng } = marker.getLngLat();
      updateMarkerPosition(idx, newLat, newLng);
    });

    return marker;
  });

  markerObjectsRef.current = newMarkers;
}, [map, markers, highlightedIndex, updateMarkerPosition, sequence]);


  useEffect(() => {
    if (map && paths) {
      const source = map.getSource('path');

      if (paths.length === 0) {
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      } else {
        if (source) {
          source.setData(paths);
        } else {
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

export default MapComponent;