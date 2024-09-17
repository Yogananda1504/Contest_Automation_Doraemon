const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require(path.join(__dirname, 'routes', 'authRoutes.js'));
const userRoutes = require(path.join(__dirname, 'routes', 'userRoutes.js'));
const { errorHandler } = require(path.join(__dirname, 'middleware', 'errorMiddleware.js'));
const connectDB = require(path.join(__dirname, 'config', 'db.js'));
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'https://turbo-meme-x5rrr57q7gwc6g9r-5173.app.github.dev' ,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());


// Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;