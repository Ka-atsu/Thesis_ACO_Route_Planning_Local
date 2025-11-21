import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapComponent = ({ addMarker, markers, markerMode, paths, updateMarkerPosition, highlightedIndex, sequence, showNumbers, showMarkers }) => {
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

  if (!showMarkers) return;

  // Create new marker instances
  const newMarkers = markers.map(({ lat, lng }, idx) => {
    const pos = sequence.findIndex(id => id === idx + 1);
    const label = pos >= 0 ? pos + 1 : idx + 1;

    const el = document.createElement('div');
    el.className = 'marker-label';
    Object.assign(el.style, {
      background: '#771f14ff',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '10px',
      borderRadius: '50%',
      width: '0.8rem',
      height: '0.8rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer'
    });
    el.textContent = showNumbers ? label : "";

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
}, [map, markers, highlightedIndex, updateMarkerPosition, sequence, showNumbers, showMarkers]);


  useEffect(() => {
  if (!map || !paths) return;

  const source = map.getSource('path');
  
  if (paths.features && paths.features.length > 0) {
    const STEP = 10; // every 10th point
    const sampled = [];

    paths.features.forEach(f => {
      if (
        f.geometry &&
        f.geometry.type === 'LineString' &&
        Array.isArray(f.geometry.coordinates)
      ) {
        // sample directly from the geometry, NO spread
        for (let i = 0; i < f.geometry.coordinates.length; i += STEP) {
          sampled.push(f.geometry.coordinates[i]);
        }
      }
    });

    if (sampled.length > 0) {
      const bounds = new maplibregl.LngLatBounds(sampled[0], sampled[0]);
      for (let i = 1; i < sampled.length; i++) {
        bounds.extend(sampled[i]);
      }

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
        duration: 800,
      });
    }
  }

  const isEmpty =
    (Array.isArray(paths) && paths.length === 0) ||
    (paths.features && paths.features.length === 0);

  if (isEmpty) {
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
          'line-opacity': 0.9,
        },
      });
    }
  }
}, [map, paths]);


  return <div ref={mapContainerRef} style={{ height: '100%' }}></div>;
};

export default MapComponent;