import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import Verify from './Pages/Verify';
import LoginSignup from './Pages/LoginSignup';
import Forgotpassword from './Pages/Forgotpassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/verify-email/:token" element={<Verify />} />
        <Route path="/reset-password/:token" element={<Forgotpassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;