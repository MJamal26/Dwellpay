const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReports } = require('../controllers/reportController');

router.get('/', protect, getReports);

module.exports = router;
