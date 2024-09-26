import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import doraemonGif from '../assets/doraemon.gif'; // Adjust the path as necessary
import doraemonGif2 from '../assets/doraemon2.gif'; // Adjust the path as necessary

const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

const Alert = ({ message, onClose, type = 'error' }) => (
  <div className={`${type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded relative mb-4`} role="alert">
    <strong className="font-bold">{type === 'error' ? 'Error: ' : 'Success: '}</strong>
    <span className="block sm:inline">{message}</span>
    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={onClose}>
      <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <title>Close</title>
        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
      </svg>
    </span>
  </div>
);

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setTimeout(() => {
      if (token) {
        navigate('/home');
      } else {
        setLoadingPage(false);
      }
    }, 2000); // 2 seconds delay to simulate loading
  }, [navigate]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    let data;
    let url;

    if (isForgotPassword) {
      const email = e.target.email.value.trim();
      url = '/api/auth/forgot-password';
      data = { email };
    } else if (isLogin) {
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      url = '/api/auth/login';
      data = { username, password };
    } else {
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      const email = e.target.email.value.trim();
      url = '/api/auth/register';
      data = { username, password, email };
    }

    // Encrypt data
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), '3b8e2').toString();

    try {
      const response = await api.post(url, { data: encryptedData });

      if (isLogin && !isForgotPassword) {
        const token = response.data.token;
        if (rememberMe) {
          localStorage.setItem('token', token);
        } else {
          sessionStorage.setItem('token', token);
        }
        navigate('/home');
      } else if (isForgotPassword) {
        setSuccess('Password reset link has been sent to your email!');
        setIsEmailSent(true);
      } else {
        // Registration successful, redirect to verification page
        setSuccess('Verification email sent! Redirecting to verification page...');
        setTimeout(() => navigate(`/verify-email/${response.data.userId}`), 3000);
      }
    } catch (error) {
      setError(error.response?.data.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    const gifs = [doraemonGif, doraemonGif2];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

    return (
      <div className="min-h-screen flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100">
      <img src={randomGif} alt="Loading..." className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 mx-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-indigo-700 text-center mb-4 sm:mb-6">
          {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back!' : 'Join Us'}
        </h1>
        {error && <Alert message={error} onClose={() => setError('')} type="error" />}
        {success && <Alert message={success} onClose={() => setSuccess('')} type="success" />}

        {!isEmailSent && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {!isForgotPassword && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-indigo-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-indigo-500" /> : <Eye className="h-5 w-5 text-indigo-500" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">Remember me</label>
                  </div>
                )}
              </>
            )}

            {isForgotPassword && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-indigo-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your registered email"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? <LoadingSpinner /> : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 sm:mt-6 text-center">
          {isLogin && !isForgotPassword && (
            <button
              onClick={toggleForgotPassword}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot Password?
            </button>
          )}
          <button
            onClick={isForgotPassword ? toggleForgotPassword : toggleForm}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mt-2 block"
          >
            {isForgotPassword
              ? 'Back to login'
              : isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}