import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function Home() {
  return (
    <div style={{ backgroundColor: '#000000', overflow: 'hidden', scrollBehavior: 'smooth' }}>
      
        <header
          id="hero"
          style={{
            height: '93vh',
            background: 'linear-gradient(160deg, #000000, #1a1a1a)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Container className="text-center text-md-start">
            <Row className="justify-content-center">
              <Col md={8}>
                <h1 className="display-3 fw-bold">Plan Multiple Stops with Us</h1>
                <p className="lead my-4">
                  Your ultimate route optimization solution save time, and simplify complex journeys.
                </p>
              </Col>
            </Row>
          </Container>
        </header>
        </div>
  );
}

export default Home;