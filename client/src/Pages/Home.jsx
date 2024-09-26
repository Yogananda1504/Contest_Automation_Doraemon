import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Nav, Button, Navbar, Form, Alert, Offcanvas } from 'react-bootstrap';
import { Menu } from 'lucide-react';
import CryptoJS from 'crypto-js';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = 'http://localhost:4000';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const Home = () => {
  const [credentials, setCredentials] = useState({
    handle: localStorage.getItem('handle') || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem('activeTab') || 'credentials');
  const [profileData, setProfileData] = useState(() => JSON.parse(sessionStorage.getItem('profileData')) || null);
  const [hasToken, setHasToken] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState(localStorage.getItem('selectedDivisions') ? JSON.parse(localStorage.getItem('selectedDivisions')) : []);
  const [isAutomated, setIsAutomated] = useState(false);
  const [automationPeriod, setAutomationPeriod] = useState(localStorage.getItem('automationPeriod') || '');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      setHasToken(true);

      const savedCredentials = JSON.parse(localStorage.getItem('cfCredentials') || '{}');
      setCredentials(prevCredentials => ({
        ...prevCredentials,
        ...savedCredentials
      }));

      const savedTab = sessionStorage.getItem('activeTab') || 'credentials';
      setActiveTab(savedTab);
    } else {
      setHasToken(false);
    }
    setLoadingPage(false);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), '3b8e2').toString();
  };

  const handleAutomation = async (automate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const encryptedData = encryptData({ automationPeriod, selectedDivisions });
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${automate ? 'automate' : 'stop-automation'}`,
        { data: encryptedData },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage(response.data.message);
      setIsAutomated(automate);
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
    if (name !== 'password') {
      localStorage.setItem(`${name}`, value);
    }
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
    localStorage.clear();
    sessionStorage.clear();
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
      const encryptedData = encryptData(credentials);
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { data: encryptedData },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setSuccessMessage('Profile updated successfully');

        localStorage.setItem('handle', credentials.handle);

        await handleFetchProfile(credentials.handle);

        setActiveTab('profile');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while updating credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async (handle) => {
    if (!hasToken) {
      return;
    }

    setLoading(true);
    try {
      const cfResponse = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      if (cfResponse.data.status === 'OK' && cfResponse.data.result.length > 0) {
        const fetchedProfile = cfResponse.data.result[0];
        setProfileData(fetchedProfile);
        sessionStorage.setItem('profileData', JSON.stringify(fetchedProfile)); // Store profile data in session storage
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
      <Container className="d-flex justify-content-center align-items-center vh-100 bg-dark text-light">
        <LoadingSpinner />
      </Container>
    );
  }

  if (!hasToken) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          You must be logged in to access this page.
          <Link to="/" className="ms-2 text-decoration-none">Go back to home page</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="primary" variant="dark" className="mb-4">
        <Container fluid>
          <Button
            variant="outline-light"
            className="me-2"
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={24} />
          </Button>
          <Navbar.Brand href="#home">Codeforces Auto Register</Navbar.Brand>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </Container>
      </Navbar>

      <Container className="flex-grow-1">
        {activeTab === 'credentials' && (
          <Row className="justify-content-md-center">
            <Col md={6}>
              <h2 className="mb-4 text-primary">Enter Credentials</h2>
              <Form onSubmit={handleSubmitCredentials} className="p-4 rounded shadow bg-white">
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

                <Button variant="primary" type="submit" disabled={loading} className="w-100">
                  {loading ? <LoadingSpinner /> : 'Update'}
                </Button>
              </Form>
            </Col>
          </Row>
        )}

        {activeTab === 'profile' && (
          <Row>
            <Col md={6}>
              <h2 className="mb-4 text-primary">Profile Information</h2>
              {profileData ? (
                <div className="p-3 rounded shadow bg-white">
                  <img src={profileData.avatar} alt={`${profileData.handle}'s avatar`} className="img-thumbnail mb-3" style={{ width: '100px' }} />
                  <p><strong>Handle:</strong> {profileData.handle}</p>
                  <p><strong>Rating:</strong> {profileData.rating}</p>
                  <p><strong>Rank:</strong> {profileData.rank}</p>
                  <p><strong>Max Rating:</strong> {profileData.maxRating}</p>
                  <p><strong>Friends Count:</strong> {profileData.friendOfCount}</p>
                </div>
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
              <h2 className="mb-4 text-primary">Settings</h2>
              <Form className="p-4 rounded shadow bg-white">
                <Form.Group className="mb-3">
                  <Form.Label>Contest Divisions</Form.Label>
                  {['Div. 1', 'Div. 2', 'Div. 3', 'Div. 4', 'Also other'].map((div) => (
                    <Form.Check
                      type="checkbox"
                      id={`division-${div}`}
                      label={div}
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
                  variant={isAutomated ? 'danger' : 'success'}
                  onClick={() => handleAutomation(!isAutomated)}
                  className="w-100"
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
                className="text-dark"
              >
                Credentials
              </Nav.Link>
              <Nav.Link
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                className="text-dark"
              >
                Profile
              </Nav.Link>
              <Nav.Link
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                className="text-dark"
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