const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getExpenses, getExpenseById, addExpense, updateExpense, deleteExpense, settleSplit } = require('../controllers/expenseController');

router.get('/', protect, getExpenses);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, addExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);
router.patch('/:id/settle/:splitUserId', protect, settleSplit);

module.exports = router;

