const { computeBalances } = require('./expenseController');
const Expense = require('../models/Expense');
const Household = require('../models/Household');

// GET /api/balances — Net balance per member
const getBalances = async (req, res) => {
  try {
    const balances = await computeBalances(req.user.householdId, req.user._id);

    // If caller is a normal (non-hidden) user, hide balances for ghost admins
    if (!req.user.isHidden) {
      const household = await Household.findById(req.user.householdId);
      const hiddenIds = new Set(
        household.members
          .filter((m) => m.hidden)
          .map((m) => m.userId.toString())
      );
      const filtered = balances.filter(
        (b) => !hiddenIds.has((b.userId?._id || b.userId).toString())
      );
      return res.json(filtered);
    }

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

    let net = 0;
    for (const exp of expenses) {
      if (!exp.paidBy) continue;
      const payerId = (exp.paidBy._id || exp.paidBy).toString();
      if (payerId === myId) {
        const otherSplit = exp.splits.find(
          (s) => s.userId && (s.userId._id || s.userId).toString() === otherId && !s.settled
        );
        if (otherSplit) net += otherSplit.amount; // other owes me (unsettled)
      } else {
        const mySplit = exp.splits.find(
          (s) => s.userId && (s.userId._id || s.userId).toString() === myId && !s.settled
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
