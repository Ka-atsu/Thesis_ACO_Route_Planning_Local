import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { FaPlus, FaStop, FaRoute, FaMinusCircle, FaUndo, FaWalking, FaArrowLeft } from 'react-icons/fa';
import { GiCycling } from "react-icons/gi";
import { IoCarSport } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

function InfoPanel({ markers, markerMode, toggleMarkerMode, removeMarker, resetMarkers, solveTSP , solveLocked, transportMode, changeTransportMode , showNumbers, toggleShowNumbers , showMarkers, toggleShowMarkers}) {

  const navigate = useNavigate();

  return (
    <Container style={{ textAlign: 'center' }}>
      <Row>
        <Form>
          <Form.Group>
            <Container className="d-flex justify-content-center align-items-center">
              <Button
                className="m-1"
                onClick={() => navigate(-1)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                <FaArrowLeft size={20} />
              </Button>
              <Button
                variant={transportMode === 'driving' ? 'light' : 'outline-light'}
                onClick={() => changeTransportMode('driving')}
                className="m-1"
                style={{ border: 'none' }}
              >
                <IoCarSport size={30} />
              </Button>
              <Button
                variant={transportMode === 'walking' ? 'light' : 'outline-light'}
                onClick={() => changeTransportMode('walking')}
                className="m-1"
                style={{ border: 'none' }}
              >
                <FaWalking size={30} />
              </Button>
              <Button
                variant={transportMode === 'cycling' ? 'light' : 'outline-light'}
                onClick={() => changeTransportMode('cycling')}
                className="m-1"
                style={{ border: 'none' }}
              >
                <GiCycling size={30} />
              </Button>
            </Container>
          </Form.Group>
        </Form>
      </Row>

      <Row className="d-flex justify-content-center">
        <Col xs={6} sm={2} md={3} lg={2} xl={6} style={{ marginTop: '1rem'}}>
          <Button
            variant={markerMode ? 'danger' : 'success'}
            onClick={toggleMarkerMode}
            style={{ width: '100%' }}
          >
            {markerMode ? <FaStop /> : <FaPlus />}
          </Button>
        </Col>
        <Col xs={6} sm={3} md={3} lg={2} xl={6} style={{ marginTop: '1rem'}}>
          <Button
            variant="primary"
            onClick={solveTSP}
            disabled={markers.length < 4 || solveLocked}
            style={{ width: '100%' }}
          >
            <FaRoute />
          </Button>
        </Col>
        <Col xs={6} sm={3} md={3} lg={2} xl={6} style={{ marginTop: '1rem'}}>
          <Button
            variant="danger"
            onClick={removeMarker}
            disabled={markers.length === 0}
            style={{ width: '100%' }}
          >
            <FaMinusCircle />
          </Button>
        </Col>
        <Col xs={6} sm={3} md={3} lg={2} xl={6} style={{ marginTop: '1rem'}}>
          <Button
            variant="warning"
            onClick={resetMarkers}
            style={{ width: '100%' }}
          >
            <FaUndo />
          </Button>
        </Col>
        <Col>
          <Form.Check
          type="switch"
          id="toggle-show-numbers"
          label={showNumbers ? "Hide Numbers" : "Show Numbers"}
          checked={showNumbers}
          onChange={toggleShowNumbers}
          className="m-1"
          style={{color:'white'}}
        />
        </Col>
        <Col>
          <Form.Check
          type="switch"
          id="toggle-show-numbers"
          label={showMarkers ? "Hide Markers & Numbers" : "Show Markers & Numbers"}
          checked={showMarkers}
          onChange={toggleShowMarkers}
          className="m-1"
          style={{color:'white'}}
        />
        </Col>
      </Row>
    </Container>
  );
}

export default InfoPanel;