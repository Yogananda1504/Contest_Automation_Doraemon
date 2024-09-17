const User = require('../models/userModel');
require('dotenv').config();
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.cfHandle = req.body.cfHandle || user.cfHandle;
    user.cfApiKey = req.body.cfApiKey || user.cfApiKey;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      cfHandle: updatedUser.cfHandle,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      cfHandle: user.cfHandle,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

module.exports = {
  updateUserProfile,
  getUserProfile,
};