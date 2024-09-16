import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Nav, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const Home = () => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);
  const [activeTab, setActiveTab] = useState('credentials');
  const [profileData, setProfileData] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setErrorMessage('You must be logged in to access this page.');
        setHasToken(false);
      } else {
        setHasToken(true);
      }
      setLoadingPage(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!hasToken) {
      setErrorMessage('You must be logged in to access this page.');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitted:', { handle, password });
      const isValid = handle && password;
      if (!isValid) {
        setErrorMessage('Please enter valid credentials.');
      } else {
        setErrorMessage('');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error submitting data', error);
      setErrorMessage('An error occurred while validating credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async () => {
    if (!hasToken || handle.trim() === '') {
      setErrorMessage('Enter valid credentials first.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
      if (response.data.status === 'OK' && response.data.result.length > 0) {
        setProfileData(response.data.result[0]);
        setErrorMessage('');
      } else {
        setErrorMessage('Invalid username. Please enter a valid Codeforces handle.');
      }
    } catch (error) {
      console.error('Error fetching profile data', error);
      setErrorMessage('An error occurred while fetching profile data.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return <LoadingSpinner />;
  }

  if (!hasToken) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          You must be logged in to access this page. 
          <Link to="/" className="ml-2">Go back to home page</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col md={3} className="bg-light sidebar">
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab('credentials')}
                active={activeTab === 'credentials'}
              >
                Credentials
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => {
                  setActiveTab('profile');
                  handleFetchProfile();
                }}
                active={activeTab === 'profile'}
              >
                Profile
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={() => setActiveTab('settings')}
                active={activeTab === 'settings'}
              >
                Settings
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={9}>
          <header className="bg-white shadow">
            <Container>
              <Row className="py-4">
                <Col>
                  <h1 className="h3">Codeforces Auto Register</h1>
                </Col>
                <Col className="text-right">
                  <Link to="/" className="btn btn-link">Logout</Link>
                </Col>
              </Row>
            </Container>
          </header>

          <main className="mt-4">
            {activeTab === 'credentials' && (
              <form onSubmit={handleSubmitCredentials}>
                <div className="mb-3">
                  <label htmlFor="handle" className="form-label">Codeforces Handle</label>
                  <input
                    type="text"
                    className="form-control"
                    id="handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Codeforces API Key</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <LoadingSpinner /> : 'Validate'}
                </button>
              </form>
            )}

            {activeTab === 'profile' && profileData && (
              <div>
                <h2>Profile Information</h2>
                <p>Last Name: {profileData.lastName}</p>
                <p>Rating: {profileData.rating}</p>
                <p>Friends Count: {profileData.friendOfCount}</p>
                <p>Handle: {profileData.handle}</p>
                <p>Rank: {profileData.rank}</p>
                <p>Max Rating: {profileData.maxRating}</p>
                <img src={profileData.avatar} alt={`${profileData.handle}'s avatar`} className="img-thumbnail" style={{width: '100px'}} />
              </div>
            )}

            {activeTab === 'profile' && !profileData && (
              <p>Please fetch your profile info by entering valid credentials in the Credentials section first.</p>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2>Settings Section</h2>
                <p>This section will be implemented later.</p>
              </div>
            )}

            {errorMessage && (
              <Alert variant="danger" className="mt-3">
                {errorMessage}
              </Alert>
            )}
          </main>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;