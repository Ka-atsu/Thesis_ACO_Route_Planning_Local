import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Kent from './developerPic/KENT.jpeg';
import Reigne from './developerPic/REYN.jpg';
import Russel from './developerPic/TANO.jpg';

function About() {
  return (
    <section
      id="about"
      style={{
        height: '93vh',
        backgroundColor: '#000000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container className="py-5">
        <Row>
          <Col md={8} className="mx-auto">
            <h2 className="fw-bold mb-4 text-center">About Us</h2>
            <p className="fs-5 text-center">
              At MultiStop Planner, we believe route planning should be straightforward and hassle-free.
              Just click on the map, add your multiple locations, and let our tool do the rest.
            </p>
            <p className="fs-5 text-center">
              Our passion for simplicity and efficiency inspired us to create a solution that removes all the complexity.
              No more tedious forms or endless steps simply mark your stops, and you're set.
            </p>

            <div className="d-flex justify-content-center mt-5">
              <div className="text-center mx-2">
                <img
                  src={Russel}
                  alt="Russel"
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' , border: '4px solid white' }}
                />
                <h5 className="mt-2">Russel</h5>
                <p>Project Manager & Developer</p>
              </div>
              <div className="text-center mx-5">
                <img
                  src={Kent}
                  alt="Kent"
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' , border: '4px solid white' }}
                />
                <h5 className="mt-2">Kent</h5>
                <p>Lead Developer</p>
              </div>
              <div className="text-center mx-4">
                <img
                  src={Reigne}
                  alt="Reigne"
                  className="rounded-circle"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' , border: '4px solid white' }}
                />
                <h5 className="mt-2">Reigne</h5>
                <p>UI/UX Designer</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default About;
