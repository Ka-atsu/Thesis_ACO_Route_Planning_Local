import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiMapPin } from 'react-icons/fi';

function feature() {
  return (
    <section
    id="feature"
    style={{
      height: '93vh',
      backgroundColor: '#0d0d0d',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <Container>
      <Row className="mb-4">
        <Col className="text-center">
          <h2 className="fw-bold">Platform Feature</h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card
            className="border-0 shadow-sm mx-auto"
            style={{
              backgroundColor: '#1a1a1a',
              color: '#fff',
              padding: '2rem',
            }}
          >
            <Card.Body className="text-center">
              <FiMapPin size={50} className="mb-3" />
              <Card.Title className="fw-bold fs-2">Optimized Routing</Card.Title>
              <Card.Text className="mt-3 fs-5">
                Automatically calculate the most efficient route for multiple stops, minimizing travel time.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  </section>
  );
}

export default feature;