const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBalances, getBalanceDetail } = require('../controllers/balanceController');

router.get('/', protect, getBalances);
router.get('/:memberId', protect, getBalanceDetail);

module.exports = router;
