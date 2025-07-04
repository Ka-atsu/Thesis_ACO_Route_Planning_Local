import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { FaPlus, FaStop, FaRoute, FaMinusCircle, FaUndo, FaWalking, FaArrowLeft } from 'react-icons/fa';
import { GiCycling } from "react-icons/gi";
import { IoCarSport } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

function InfoPanel({ markers, markerMode, toggleMarkerMode, removeMarker, resetMarkers, solveTSP, transportMode, changeTransportMode }) {

  const navigate = useNavigate();

  return (
    <>
      <Button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '0.5rem',
          zIndex: 1000,
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '1rem'
        }}
      >
        <FaArrowLeft size={24} style={{ color: 'white' }} />
      </Button>
      
      <Container style={{ textAlign: 'center' }}>
        <Row className="flex-d flex-column">
          <Col>
            <Form>
              <Form.Group>
                <Container className="d-flex justify-content-center mb-">
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
                </Container>
              </Form.Group>
            </Form>
          </Col>
        </Row>

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