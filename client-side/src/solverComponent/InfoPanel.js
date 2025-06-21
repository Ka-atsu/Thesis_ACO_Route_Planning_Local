// import React, {useState} from 'react';
import React from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { FaPlus, FaStop, FaRoute, FaMinusCircle, FaUndo, FaWalking, FaArrowLeft } from 'react-icons/fa';
import { GiCycling } from "react-icons/gi";
import { IoCarSport } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

// function formatTime(seconds) {
//   const hours = Math.floor(seconds / 3600);  // Convert seconds to hours
//   const remainingMinutes = Math.floor((seconds % 3600) / 60);  // Remaining minutes
//   return `${hours}h ${remainingMinutes}m`;
// }

function InfoPanel({
  markers,
  markerMode,
  toggleMarkerMode,
  removeMarker,
  resetMarkers, 
  solveTSP,
  distance,
  estimatedTime, 
  transportMode,
  changeTransportMode,
  avoidTolls,
  setAvoidTolls,
  locationNames,
  onLocationClick,
  toggleRouteOption,  
  currentRouteOption,  
}) {
  // const formattedTime = formatTime(estimatedTime);
  const navigate = useNavigate();

  // const [highlightedIndex, setHighlightedIndex] = useState(null);

  // const handleLocationClick = (index) => {
  //   setHighlightedIndex(index);  // Set the clicked index to highlight it
  // };

  // const handleClick = (index) => {
  //   handleLocationClick(index);  // Highlight the clicked item
  //   onLocationClick(index);  // Call the external handler
  // };
  
  return (
    <>
      {/* Floating Back Button with No Background and No Border */}
      <Button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '10px'
        }}
      >
        <FaArrowLeft size={24} style={{ color: 'white' }} />
      </Button>
      
      <Container style={{ textAlign: 'center' }}>
        <Row className="flex-d flex-column">
          <Col>
            <Form>
              <Form.Group>
                <div className="d-flex justify-content-center mb-">
                  <Button
                    variant={transportMode === 'driving' ? 'light' : 'outline-light'}
                    onClick={() => changeTransportMode('driving')}
                    className="m-1"
                    style={{ border: 'none' }}
                  >
                    <IoCarSport size={32} />
                  </Button>
                  <Button
                    variant={transportMode === 'walking' ? 'light' : 'outline-light'}
                    onClick={() => changeTransportMode('walking')}
                    className="m-1"
                    style={{ border: 'none' }}
                  >
                    <FaWalking size={32} />
                  </Button>
                  <Button
                    variant={transportMode === 'cycling' ? 'light' : 'outline-light'}
                    onClick={() => changeTransportMode('cycling')}
                    className="m-1"
                    style={{ border: 'none' }}
                  >
                    <GiCycling size={32} />
                  </Button>
                </div>
              </Form.Group>
            </Form>
          </Col>
        </Row>

        {/* <div>
          <p className='text-start' style={{ marginTop: '1rem', fontSize: '25px', color: 'white' }}>
          Total Distance: {distance.toFixed(2)} km
          </p>
          <p className='text-start' style={{ fontSize: '25px', color: 'white' }}>
          Estimated Travel Time: {formattedTime}
          </p>
        </div> */}

        {/* <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#303030', borderRadius: '5px', color: 'white', height: '300px', overflow: 'auto' }}>
          <h4>Route Sequence</h4>
            <ul style={{ fontSize: '20px', listStyleType: 'none', paddingLeft: '0' }}>
            {locationNames && locationNames.length > 0 ? (
              locationNames.map((name, index) => (
              <li 
                key={index} 
                style={{ marginBottom: '8px', cursor: 'pointer' , backgroundColor: highlightedIndex === index ? '#FF5733' : 'transparent' }} 
                onClick={() => handleClick(index)}  // Pass the clicked index to parent
                >
                {name}
              </li>
              ))
              ) : (
              <li>No locations available</li> // Message if no markers are available
            )}
          </ul>
        </div> */}

        {/* <Row className="d-flex justify-content-center" style={{ marginTop: '2rem' }}>
          <Col xs={12}>
            <Button
              onClick={toggleRouteOption}
              variant="info"
              style={{ width: '100%' }}
            >
              {currentRouteOption === 'best'
                ? "Show Beam ACO"
                : "Show Traditional ACO"}
            </Button>
          </Col>
        </Row> */}

        <Row className="d-flex justify-content-center">
          <Col xs={6} sm={3} md={3} lg={3} style={{ marginTop: '1rem'}}>
            <Button
              variant={markerMode ? 'danger' : 'success'}
              onClick={toggleMarkerMode}
              style={{ width: '100%' }}
            >
              {markerMode ? <FaStop /> : <FaPlus />}
            </Button>
          </Col>
          <Col xs={6} sm={3} md={3} lg={3} style={{ marginTop: '1rem'}}>
            <Button
              variant="primary"
              onClick={solveTSP}
              disabled={markers.length < 4}
              style={{ width: '100%' }}
            >
              <FaRoute />
            </Button>
          </Col>
          <Col xs={6} sm={3} md={3} lg={3} style={{ marginTop: '1rem'}}>
            <Button
              variant="danger"
              onClick={removeMarker}
              disabled={markers.length === 0}
              style={{ width: '100%' }}
            >
              <FaMinusCircle />
            </Button>
          </Col>
          <Col xs={6} sm={3} md={3} lg={3} style={{ marginTop: '1rem'}}>
            <Button
              variant="warning"
              onClick={resetMarkers}
              style={{ width: '100%' }}
            >
              <FaUndo />
            </Button>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default InfoPanel;