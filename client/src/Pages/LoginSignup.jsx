import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'react-feather';
import axios from 'axios';

const LoadingSpinner = () => (
  <div className='flex flex-col  justify-content-center align-items-center '>
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    <div className="Loader text-lg font-bold text-indigo-500 mt-1 text-center">Chill h 😂</div>
  </div>
);

function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingPage(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const toggleForm = () => setIsLogin(!isLogin);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = isLogin ? '/api/login' : '/api/signup';
    const data = { username: e.target.username.value, password: e.target.password.value };

    try {
      const response = await axios.post(url, data);
      const token = response.data.token;

      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }

      navigate('/home');
    } catch (error) {
      console.error('Error during authentication', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-extrabold text-center mb-8 text-indigo-700">
          {isLogin ? 'Welcome Back!' : 'Join Us'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-indigo-500" />
              </div>
              <input
                type="text"
                name="username"
                id="username"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-indigo-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Enter your password"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="focus:outline-none text-indigo-500 hover:text-indigo-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleForm}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;