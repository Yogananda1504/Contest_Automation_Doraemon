const express = require("express");
const router = express.Router();
const {
    updateUserProfile,
    getUserProfile,
    automateLogin,
    stopUserAutomation
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Profile routes
router
    .route("/profile")
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Automate contest registration route
router.post('/automate', protect, automateLogin);

// Stop automation route
router.post('/stop-automation', protect, stopUserAutomation);

module.exports = router;
