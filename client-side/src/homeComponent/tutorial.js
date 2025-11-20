import React, { useRef } from 'react';
import { Container, Carousel, Button, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MdKeyboardArrowRight, MdOutlineKeyboardArrowLeft } from "react-icons/md";

const tutorialSteps = [
  {
    video: "https://drive.google.com/file/d/1TKdSUDn3dKANBMbpifSolHMb5cJmIrSg/preview"
  },
];

const SystemSummary = () => (
  <Card className="mb-4" style={{ backgroundColor: "#1e1e1e", color: "white", borderRadius: "12px" }}>
    <Card.Body>
      <Card.Title as="h4">System Overview</Card.Title>
      <Card.Text>
        This system helps users plan and optimize routes effectively. 
        It provides tools to add, manage, and calculate paths across 
        multiple locations in a simple and interactive way.
      </Card.Text>
      <ul>
        <li>Add and remove markers on the map</li>
        <li>Generate optimized routes instantly</li>
        <li>View statistics to see which of the 2 algorithm is better</li>
        <li>Reset and recalculate with ease</li>
      </ul>
      <Card.Text>
        By following this tutorial, you’ll quickly learn how to make 
        the most of the system’s routing and analysis features.
      </Card.Text>
    </Card.Body>
  </Card>
);

const Tutorial = () => {
  const carouselRef = useRef(null);

  return (
    <Container
      className="p-5"
      style={{ minHeight: '93vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <h2 className="text-center mb-4" style={{ color: 'white' }}>
        Tutorial: How to use the System
      </h2>

      {/* ✅ Insert summary here */}
      <SystemSummary />

      <div style={{ width: '100%', position: 'relative' }}>
        <Carousel
          ref={carouselRef}
          prevIcon={<span style={{ display: 'none' }} />}
          nextIcon={<span style={{ display: 'none' }} />}
          controls={false}
          interval={null}
        >
          {tutorialSteps.map((step, index) => (
            <Carousel.Item key={index}>
              {/* Google Drive video embed */}
              <iframe
                src={step.video}
                className="d-block w-100"
                style={{ aspectRatio: '16 / 9', background: 'black', border: 'none' }}
                allow="autoplay"
                allowFullScreen
                title={`tutorial-${index}`}
              ></iframe>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Custom previous/next buttons */}
        <Button
          onClick={() => carouselRef.current.prev()}
          style={{
            position: 'absolute', top: '50%', left: '-80px',
            transform: 'translateY(-50%)', zIndex: 5,
            background: 'none', border: 'none', fontSize: '8vh'
          }}
        >
          <MdOutlineKeyboardArrowLeft />
        </Button>
        <Button
          onClick={() => carouselRef.current.next()}
          style={{
            position: 'absolute', top: '50%', right: '-80px',
            transform: 'translateY(-50%)', zIndex: 5,
            background: 'none', border: 'none', fontSize: '8vh'
          }}
        >
          <MdKeyboardArrowRight />
        </Button>
      </div>
    </Container>
  );
};

export default Tutorial;