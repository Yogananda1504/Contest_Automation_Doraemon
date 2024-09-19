const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const User = require('../models/userModel');
require('dotenv').config();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register User
const registerUser = async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Attempting to register user:', username);
    console.log('Password length:', password.length);

    if (!username || !password) {
        console.log('Registration failed: Missing fields');
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    try {
        // Check if user exists
        const userExists = await User.findOne({ username });
        
        if (userExists) {
            console.log('Registration failed: User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password using Argon2 before saving
        const hashedPassword = await argon2.hash(password);
        console.log('Password hashed successfully:', hashedPassword);

        // Ensure the hashed password starts with a $
        if (!hashedPassword.startsWith('$')) {
            console.error('Hashed password is not in the correct format');
            return res.status(500).json({ message: 'Server error' });
        }

        // Create user
        const user = await User.create({
            username,
            password: hashedPassword,
        });

        if (user) {
            console.log('User registered successfully:', user.username);
            return res.status(201).json({
                _id: user.id,
                username: user.username,
                token: generateToken(user._id),
            });
        } else {
            console.log('Registration failed: Invalid user data');
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Server error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login User
const loginUser = async (req, res) => {
    const { username, password } = req.body;
    
    console.log('Attempting to log in user:', username);
    console.log('Password length:', password.length);

    if (!username || !password) {
        console.log('Login failed: Missing fields');
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    try {
        const user = await User.findOne({ username });
        console.log('User found:', !!user);

        if (user) {
            console.log('Stored password hash:', user.password);

           

            const passwordMatch = await argon2.verify(user.password, password);
            console.log('Password match:', passwordMatch);

            if (passwordMatch) {
                console.log('Login successful for user:', user.username);
                return res.json({
                    _id: user.id,
                    username: user.username,
                    token: generateToken(user._id),
                });
            }
        }

        console.log('Login failed: Invalid credentials');
        return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser };