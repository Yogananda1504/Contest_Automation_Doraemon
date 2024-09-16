import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import Home from './Pages/Home';
import LoginSignup from './Pages/LoginSignup';




const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;