import { useState } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Home from '../homeComponent/home';
import Feature from '../homeComponent/feature';
import About from '../homeComponent/about';
import Tutorial from '../homeComponent/tutorial';

function HomePage() {
  const [activeSection, setActiveSection] = useState('home'); 
  const [animation, setAnimation] = useState('fade-in'); 
  const navigate = useNavigate();

  const navigateSection = (section) => {
    setAnimation('fade-out'); 
    setTimeout(() => {
      setActiveSection(section); 
      setAnimation('fade-in'); 
    }, 300);
  };

  const navigation = (section) => {
    setAnimation('fade-out'); 
    setTimeout(() => {
      navigate(section); 
      setAnimation('fade-in'); 
    }, 300);
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
            onClick={() => navigateSection('home')} 
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
                onClick={() => navigateSection('feature')}
                active={activeSection === 'feature'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Feature
              </Button>
              <Button
                variant="link"
                onClick={() => navigateSection('about')}
                active={activeSection === 'about'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                About
              </Button>
              <Button
                variant="link"
                onClick={() => navigateSection('tutorial')}
                active={activeSection === 'tutorial'}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Tutorial
              </Button>
              <Button variant="light" size="sm" className="ms-3" onClick={() => navigation('/solve')}>
                Get Started
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Main content section with fade-in/out animation */}
      <div className={`section ${animation}`}>
        {activeSection === 'home' && <Home />}
        {activeSection === 'feature' && <Feature />}
        {activeSection === 'about' && <About />}
        {activeSection === 'tutorial' && <Tutorial />}
      </div>

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