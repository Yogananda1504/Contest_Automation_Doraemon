const express = require('express');
const router = express.Router();
const { updateUserProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// router.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', 'https://turbo-meme-x5rrr57q7gwc6g9r-5173.app.github.dev');
//     res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     res.header('Access-Control-Allow-Credentials', 'true');
//     if (req.method === 'OPTIONS') {
//       return res.status(204).send('');
//     }
//     next();
// });

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;