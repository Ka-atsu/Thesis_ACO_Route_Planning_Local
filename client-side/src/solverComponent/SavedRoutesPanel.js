import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import { FaTrash } from 'react-icons/fa';

const SavedRoutesPanel = ({ savedRoutes, loadRoute, saveRoute, deleteRoute }) => {
  return (
    <Container
      fluid
      style={{
        marginTop: '1rem',
        backgroundColor: '#303030',
        padding: '1rem',
        borderRadius: '0.5rem',
        maxHeight: '600px',
        overflowY: 'auto'
      }}
    >
      <h4 style={{ color: 'white' }}>Saved Pin</h4>

      {savedRoutes && savedRoutes.length > 0 ? (
        <ListGroup variant="flush">
          {savedRoutes.map((route, index) => (
            <ListGroup.Item
              key={index}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ cursor: 'pointer' }} onClick={() => loadRoute(route)}>
                {route.name}
              </span>

              {!route.isPredefined && (
                <Button variant="danger" size="sm" onClick={() => deleteRoute(index)}>
                  <FaTrash />
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p style={{ color: 'white' }}>No saved routes yet.</p>
      )}

      <Button
        variant="secondary"
        onClick={saveRoute}
        style={{ marginTop: '1rem' }}
      >
        Save Current Pin
      </Button>
    </Container>
  );
};

export default SavedRoutesPanel;