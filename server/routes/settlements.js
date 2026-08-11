const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSettlements, createSettlement, markSettled } = require('../controllers/settlementController');

router.get('/', protect, getSettlements);
router.post('/', protect, createSettlement);
router.put('/:id/settle', protect, markSettled);

module.exports = router;
