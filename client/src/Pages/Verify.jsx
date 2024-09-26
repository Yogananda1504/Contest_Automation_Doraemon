import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Cancel, Info } from '@mui/icons-material';
import { Alert, AlertTitle, TextField, Button, Typography, Box, Paper } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const Verify = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const { userId } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('pending');
    setMessage('Verifying your email...');

    try {
      const response = await api.post('/api/auth/verify-email', { userId, token });
      setStatus('success');
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />;
      case 'error':
        return <Cancel sx={{ fontSize: 40, color: 'error.main' }} />;
      default:
        return <Info sx={{ fontSize: 40, color: 'info.main', animation: 'pulse 2s infinite' }} />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #E3F2FD, #E1BEE7)',
        p: 4,
      }}
    >
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {getStatusIcon()}
          </Box>
          <Typography variant="h4" component="h2" gutterBottom>
            Email Verification
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please enter the verification token sent to your email.
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter verification token"
              variant="outlined"
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Verify Email
            </Button>
          </form>
        </Paper>
        {message && (
          <Alert severity={status === 'error' ? 'error' : 'info'} sx={{ mt: 2 }}>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default Verify;