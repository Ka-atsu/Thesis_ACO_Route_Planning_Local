import { useState } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import Home from '../homeComponent/home';
import Feature from '../homeComponent/feature';
import About from '../homeComponent/about';
import Tutorial from '../homeComponent/tutorial';

function HomePage() {
  const [activeSection, setActiveSection] = useState('home'); 
  const [animation, setAnimation] = useState('fade-in'); 
  const navigate = useNavigate();

  const navigation = (section) => {
    setAnimation('fade-out'); // Trigger fade-out animation before changing section
    setTimeout(() => {
      setActiveSection(section); // Update active section after animation
      setAnimation('fade-in'); // Trigger fade-in animation after the section is updated
    }, 300); // Wait for the fade-out animation to finish before changing the section
  };

  const toSolverPage = (section) => {
    setAnimation('fade-out'); // Trigger fade-out animation before changing section
    setTimeout(() => {
      navigate(section); // Update active section after animation
      setAnimation('fade-in'); // Trigger fade-in animation after the section is updated
    }, 300); // Wait for the fade-out animation to finish before changing the section
  };

  return (
    <div style={{ backgroundColor: '#000000', overflow: 'hidden', scrollBehavior: 'smooth' }}>
      <Navbar sticky="top" bg="dark" variant="dark" expand="lg"
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          backgroundColor: '#000000',
          minHeight: '7vh'
        }}
      >
        <Container>
          <Navbar.Brand
            onClick={() => navigation('home')} 
            className="fw-bold"
            style={{ cursor: 'pointer' }}
          >
            MultiStop Planner
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Button
                variant="link"
                onClick={() => navigation('feature')}
                active={activeSection === 'feature'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Feature
              </Button>
              <Button
                variant="link"
                onClick={() => navigation('about')}
                active={activeSection === 'about'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                About
              </Button>
              <Button
                variant="link"
                onClick={() => navigation('tutorial')}
                active={activeSection === 'tutorial'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Tutorial
              </Button>
              <Button variant="light" size="sm" className="ms-3" onClick={() => toSolverPage('/solve')}>
                Get Started
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Conditionally Render Sections with Fade-In/Out Animations */}
      <div className={`section ${animation}`}>
        {activeSection === 'home' && <Home />}
        {activeSection === 'feature' && <Feature />}
        {activeSection === 'about' && <About />}
        {activeSection === 'tutorial' && <Tutorial />}
      </div>

      {/* Simple Fade-In/Out Animation via CSS */}
      <style jsx>{`
        .section {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        .fade-out {
          opacity: 0;
        }
        .fade-in {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default HomePage;