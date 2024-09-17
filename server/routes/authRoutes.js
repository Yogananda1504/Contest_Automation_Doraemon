//authRoutes.js

const express = require('express');
const router = express.Router();
const cors = require('cors');
const { registerUser, loginUser } = require('../controllers/authController');
const { updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(cors({
    origin: 'http://localhost:5173' ,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
router.use(express.json());
// Auth routes
router.post('/register', registerUser)
router.post('/login', loginUser);
module.exports = router;