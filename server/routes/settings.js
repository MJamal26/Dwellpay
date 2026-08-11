const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateProfile } = require('../controllers/settingsController');

router.put('/profile', protect, updateProfile);

module.exports = router;
