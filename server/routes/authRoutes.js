const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// router.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*'); 
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
// });

// Auth routes
router.post('/register', registerUser)
router.post('/login', loginUser);
module.exports = router;