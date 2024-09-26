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
        <Route exact path="/" element={<LoginSignup />} />
        <Route exact path="/home" element={<Home />} />
        <Route exact path="/verify-email" element={<Verify />} />
        <Route exact path="/reset-password/:token" element={<Forgotpassword />} />
        <Route exact path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;