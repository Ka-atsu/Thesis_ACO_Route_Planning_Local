import React, { useRef } from 'react';
import { Container, Carousel, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Step1 from './tutorialPic/Step1.png';
import Step2 from './tutorialPic/Step2.png';
import Step3 from './tutorialPic/Step3.png';
import Step5 from './tutorialPic/Step5.png';
import Step6 from './tutorialPic/Step6.png';
import { MdKeyboardArrowRight, MdOutlineKeyboardArrowLeft } from "react-icons/md";

const tutorialSteps = [
  {
    text: "Click the add button to enable adding marker on the map.",
    img: Step1
  },
  {
    text: "Place the marker in the map, it acts as locations.",
    img: Step2
  },
  {
    text: "Press the blue button to calculate the best route with all the stops you've added.",
    img: Step3
  },
  {
    text: "Click the remove button to remove the last added marker from your route list.",
    img: Step5
  },
  {
    text: "Click the reset button to reset the marker placed on the map",
    img: Step6
  },
  // Add more steps as needed
];

const Tutorial = () => {
  const carouselRef = useRef(null);

  return (
    <Container className="p-5" style={{ minHeight: '93vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="text-center mb-4" style={{ color: 'white' }}>Tutorial: How to use the System</h2>
      <div style={{ width: '100%', position: 'relative' }}>
        <Carousel 
          ref={carouselRef}
          prevIcon={<span style={{ display: 'none' }} />} // Hides the default previous icon
          nextIcon={<span style={{ display: 'none' }} />} // Hides the default next icon
          controls={false} // Removes the default prev/next buttons
          interval={null} // Disables auto-slide
        >
          {tutorialSteps.map((step, index) => (
            <Carousel.Item key={index}>
              <img
                className="d-block w-100"
                src={step.img}
                alt={`Step ${index + 1}`}
              />
              <Carousel.Caption style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', borderRadius: '4px' }}>
                <p>{step.text}</p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
        {/* Custom previous and next buttons */}
        <Button
          onClick={() => carouselRef.current.prev()}
          style={{ position: 'absolute', top: '50%', left: '-80px', transform: 'translateY(-50%)', zIndex: 5 , background: 'none' , border: 'none' , fontSize: '8vh'}}
        >
          <MdOutlineKeyboardArrowLeft />
        </Button>
        <Button
          onClick={() => carouselRef.current.next()}
          style={{ position: 'absolute', top: '50%', right: '-80px', transform: 'translateY(-50%)', zIndex: 5 , background: 'none' , border: 'none' ,fontSize: '8vh' }}
        >
            <MdKeyboardArrowRight />
        </Button>
      </div>
    </Container>
  );
}

export default Tutorial;
