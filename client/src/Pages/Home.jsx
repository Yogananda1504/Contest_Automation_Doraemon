import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Nav, Button, Navbar, Form, Alert, Offcanvas } from 'react-bootstrap';
import { Menu } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:4000'; // Update this to your actual backend URL

const LoadingSpinner = () => (
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Loading...</span>
  </div>
);

const Home = () => {
  const [credentials, setCredentials] = useState({
    handle: localStorage.getItem('handle') || '',
    password: localStorage.getItem('password') || '',
    APIkey: localStorage.getItem('APIkey') || ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('activeTab') || 'credentials');
  const [profileData, setProfileData] = useState(null);
  const [hasToken, setHasToken] = useState(!!(localStorage.getItem('token') || sessionStorage.getItem('token')));
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState(localStorage.getItem('selectedDivisions') ? JSON.parse(localStorage.getItem('selectedDivisions')) : []);
  const [isAutomated, setIsAutomated] = useState(false);
  const [automationPeriod, setAutomationPeriod] = useState(localStorage.getItem('automationPeriod') || '');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setHasToken(!!token);

    // Load saved credentials
    const savedCredentials = JSON.parse(localStorage.getItem('cfCredentials') || '{}');
    setCredentials(prevCredentials => ({
      ...prevCredentials,
      ...savedCredentials
    }));

    // Load saved active tab from session storage
    const savedTab = sessionStorage.getItem('activeTab') || 'credentials';
    setActiveTab(savedTab);

    setLoadingPage(false);

    // Fetch profile data if credentials are available
    if (savedCredentials.handle) {
      handleFetchProfile(savedCredentials.handle);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleAutomation = async (automate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${automate ? 'automate' : 'stop-automation'}`,
        { automationPeriod, selectedDivisions },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage(response.data.message);
      setIsAutomated(automate); // Toggle automation state
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred during automation.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prevCredentials => ({
      ...prevCredentials,
      [name]: value
    }));
    localStorage.setItem(`${name}`, value);
  };

  const handleDivisionChange = (division) => {
    const updatedDivisions = selectedDivisions.includes(division)
      ? selectedDivisions.filter(d => d !== division)
      : [...selectedDivisions, division];
    setSelectedDivisions(updatedDivisions);
    localStorage.setItem('selectedDivisions', JSON.stringify(updatedDivisions));
  };

  const handlePeriodChange = (e) => {
    setAutomationPeriod(e.target.value);
    localStorage.setItem('automationPeriod', e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('cfCredentials');
    sessionStorage.removeItem('activeTab');
    localStorage.removeItem('selectedDivisions');
    localStorage.removeItem('automationPeriod');
    navigate('/');
  };

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!hasToken) {
      setErrorMessage('You must be logged in to access this page.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setSuccessMessage('Profile updated successfully');
        localStorage.setItem('cfCredentials', JSON.stringify(credentials));
        await handleFetchProfile(credentials.handle);
        setActiveTab('profile'); // Switch to profile tab after successful update
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while updating credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async (handle) => {
    if (!hasToken) {
      setErrorMessage('You must be logged in to fetch profile data.');
      return;
    }

    setLoading(true);
    try {
      const cfResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      if (cfResponse.data.status === 'OK' && cfResponse.data.result.length > 0) {
        setProfileData(cfResponse.data.result[0]);
        setErrorMessage('');
      } else {
        setErrorMessage('Invalid Codeforces handle. Please update your profile with a valid handle.');
      }
    } catch (error) {
      setErrorMessage('An error occurred while fetching profile data.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner />
      </Container>
    );
  }

  if (!hasToken) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          You must be logged in to access this page.
          <Link to="/" className="ms-2">Go back to home page</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container fluid>
          <Button
            variant="outline-light"
            className="me-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={24} />
          </Button>
          <Navbar.Brand href="#home">Codeforces Auto Register</Navbar.Brand>
          <Button variant="outline-light" onClick={handleLogout}>Logout</Button>
        </Container>
      </Navbar>

      <Container className="flex-grow-1">
        {activeTab === 'credentials' && (
          <Row className="justify-content-md-center">
            <Col md={6}>
              <h2 className="mb-4">Enter Credentials</h2>
              <Form onSubmit={handleSubmitCredentials}>
                <Form.Group className="mb-3" controlId="handle">
                  <Form.Label>Codeforces Handle</Form.Label>
                  <Form.Control
                    type="text"
                    name="handle"
                    placeholder="Enter your Codeforces handle"
                    value={credentials.handle}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Codeforces Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter your Password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="APIkey">
                  <Form.Label>Codeforces API Key</Form.Label>
                  <Form.Control
                    type="password"
                    name="APIkey"
                    placeholder="Enter your API key"
                    value={credentials.APIkey}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? <LoadingSpinner /> : 'Update'}
                </Button>
              </Form>
            </Col>
          </Row>
        )}

        {activeTab === 'profile' && (
          <Row>
            <Col md={6}>
              <h2 className="mb-4">Profile Information</h2>
              {profileData ? (
                <>
                  <img src={profileData.avatar} alt={`${profileData.handle}'s avatar`} className="img-thumbnail mb-3" style={{ width: '100px' }} />
                  <p><strong>Handle:</strong> {profileData.handle}</p>
                  <p><strong>Last Name:</strong> {profileData.lastName}</p>
                  <p><strong>Rating:</strong> {profileData.rating}</p>
                  <p><strong>Rank:</strong> {profileData.rank}</p>
                  <p><strong>Max Rating:</strong> {profileData.maxRating}</p>
                  <p><strong>Friends Count:</strong> {profileData.friendOfCount}</p>
                </>
              ) : (
                <Alert variant="info">
                  No profile data available. Please enter valid credentials in the Credentials section and update your profile.
                </Alert>
              )}
            </Col>
          </Row>
        )}

        {activeTab === 'settings' && (
          <Row>
            <Col md={6}>
              <h2 className="mb-4">Settings</h2>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Contest Divisions</Form.Label>
                  {['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4'].map((div) => (
                    <Form.Check
                      type="checkbox"
                      id={`division-${div}`}
                      label={`${div} ${div === 'Div. 1' ? '(2100+)' :
                        div === 'Div. 2' ? '(<2100)' :
                          div === 'Div. 3' ? '(<1600)' : '(<1400)'}`}
                      checked={selectedDivisions.includes(div)}
                      onChange={() => handleDivisionChange(div)}
                      key={div}
                    />
                  ))}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Automation Period</Form.Label>
                  <Form.Select
                    value={automationPeriod}
                    onChange={handlePeriodChange}
                  >
                    <option value="">Select Period</option>
                    <option value="daily">Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                  </Form.Select>
                </Form.Group>
                <Button
                  variant="primary"
                  onClick={() => handleAutomation(!isAutomated)}
                >
                  {isAutomated ? 'Stop Automation' : 'Start Automation'}
                </Button>
              </Form>
            </Col>
          </Row>
        )}

        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">
              <Nav.Link
                active={activeTab === 'credentials'}
                onClick={() => setActiveTab('credentials')}
              >
                Credentials
              </Nav.Link>
              <Nav.Link
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </Nav.Link>
              <Nav.Link
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>
      </Container>

      {errorMessage && (
        <Alert variant="danger" className="fixed-bottom m-3">
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" className="fixed-bottom m-3">
          {successMessage}
        </Alert>
      )}
    </div>
  );
};

export default Home;
