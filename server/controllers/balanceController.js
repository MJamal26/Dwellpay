const { computeBalances } = require('./expenseController');
const Expense = require('../models/Expense');

// GET /api/balances — Net balance per member
const getBalances = async (req, res) => {
  try {
    const balances = await computeBalances(req.user.householdId);
    res.json(balances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/balances/:memberId — Detailed transactions between current user and one member
const getBalanceDetail = async (req, res) => {
  try {
    const myId = req.user._id.toString();
    const otherId = req.params.memberId;

    const expenses = await Expense.find({
      householdId: req.user.householdId,
      $or: [
        { paidBy: myId, 'splits.userId': otherId },
        { paidBy: otherId, 'splits.userId': myId },
      ],
    })
      .sort({ date: -1 })
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    // Net between just these two people — only unsettled splits count
    let net = 0;
    for (const exp of expenses) {
      const payerId = exp.paidBy._id.toString();
      if (payerId === myId) {
        const otherSplit = exp.splits.find(
          (s) => s.userId._id.toString() === otherId && !s.settled
        );
        if (otherSplit) net += otherSplit.amount; // other owes me (unsettled)
      } else {
        const mySplit = exp.splits.find(
          (s) => s.userId._id.toString() === myId && !s.settled
        );
        if (mySplit) net -= mySplit.amount; // I owe other (unsettled)
      }
    }

    res.json({ expenses, net });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getBalances, getBalanceDetail };
