import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FiMapPin, FiTrendingUp, FiDatabase, FiBarChart2, FiLayers, FiSave } from 'react-icons/fi';

function Feature() {
  const features = [
    {
      icon: <FiMapPin size={40} className="mb-3" />,
      title: "Optimized Routing",
      text: "Automatically calculate the shortest and most efficient routes using Ant Colony Optimization (ACO) and Beam Search."
    },
    {
      icon: <FiTrendingUp size={40} className="mb-3" />,
      title: "Algorithm Comparison",
      text: "Easily compare ACO and Beam ACO performance side-by-side with real-time maps and metrics."
    },
    {
      icon: <FiDatabase size={40} className="mb-3" />,
      title: "Scalability",
      text: "Efficiently handle datasets with 50, 150, or even 250+ stops for large-scale logistics simulations."
    },
    {
      icon: <FiBarChart2 size={40} className="mb-3" />,
      title: "Performance Metrics",
      text: "Track route distance, computation time, memory usage, and convergence across iterations."
    },
    {
      icon: <FiLayers size={40} className="mb-3" />,
      title: "Interactive Visualization",
      text: "Visualize routes directly on the map with intuitive, side-by-side comparisons."
    },
    {
      icon: <FiSave size={40} className="mb-3" />,
      title: "Scenario Management",
      text: "Save, load, and compare multiple scenarios (e.g., Cabuyao, Laguna, Philippines) for repeatable experiments."
    }
  ];

  return (
    <section
      id="feature"
      style={{
        minHeight: '93vh',
        backgroundColor: '#0d0d0d',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '3rem 0'
      }}
    >
      <Container>
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="fw-bold">Platform Features</h2>
            <p className="text-muted fs-5">
              Powerful tools to optimize, analyze, and visualize multi-stop routing scenarios.
            </p>
          </Col>
        </Row>
        <Row>
          {features.map((feature, index) => (
            <Col key={index} md={4} className="mb-4">
              <Card
                className="border-0 shadow-sm h-100 text-center"
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: '2rem'
                }}
              >
                <Card.Body>
                  {feature.icon}
                  <Card.Title className="fw-bold fs-4">{feature.title}</Card.Title>
                  <Card.Text className="mt-2 fs-6">{feature.text}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}

export default Feature;