import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE_URI = "http://localhost:4000";

const Verify = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [message, setMessage] = useState('Please wait while we verify your email.');
  const [success, setSuccess] = useState(null);

  const verifyEmail = useCallback(async () => {
    if (verificationComplete) return;

    try {
      console.log('Verifying token:', token);
      const response = await axios.get(`${API_BASE_URI}/api/auth/verify-email/${token}`);
      setMessage(response.data.message);
      setSuccess(true);
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      setMessage(serverMessage || 'Verification failed');
      setSuccess(false);
    } finally {
      setVerificationComplete(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [token, navigate, verificationComplete]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: verificationComplete ? 0 : 360 }}
          transition={{ repeat: verificationComplete ? 0 : Infinity, duration: 2, ease: "linear" }}
          className="mb-4"
        >
          <div className={`rounded-full h-12 w-12 mx-auto ${success === null ? 'bg-gray-500' : success ? 'bg-green-500' : 'bg-red-500'}`}/>
        </motion.div>
        <h2 className="text-lg font-bold">{verificationComplete ? 'Verification Status' : 'Verifying...'}</h2>
        <p className="mt-2 text-gray-600">{message}</p>
      </motion.div>
    </div>
  );
};

export default Verify;