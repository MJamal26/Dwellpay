const Expense = require('../models/Expense');
const Household = require('../models/Household');
const { sendPushToUsers } = require('../utils/pushNotification');


// Helper: compute equal splits for an expense
const computeEqualSplits = (amount, memberIds) => {
  const share = parseFloat((amount / memberIds.length).toFixed(2));
  const splits = memberIds.map((id, idx) => {
    // Distribute rounding difference to first member
    const adj = idx === 0 ? parseFloat((amount - share * memberIds.length).toFixed(2)) : 0;
    return { userId: id, amount: share + adj, percentage: parseFloat((100 / memberIds.length).toFixed(2)), settled: false };
  });
  return splits;
};

// GET /api/expenses?page=1&limit=20&category=food&month=2026-08&date=2026-08-10
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 30, category, month, date } = req.query;
    const query = { householdId: req.user.householdId };

    if (category) query.category = category;

    if (date) {
      // Specific day filter takes priority over month
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    } else if (month) {
      const [year, mon] = month.split('-');
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    const total = await Expense.countDocuments(query);

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const { description, amount, currency, category, paidBy, date, splitType, splits, notes } = req.body;

    if (!description || !amount || !paidBy)
      return res.status(400).json({ message: 'description, amount, and paidBy are required' });

    const household = await Household.findById(req.user.householdId).populate('members.userId', 'name');
    const memberIds = household.members.map((m) => m.userId?._id || m.userId).filter(Boolean);

    let finalSplits;
    if (splits && splits.length > 0) {
      // Trust the splits sent by the client (respects member include/exclude)
      finalSplits = splits;
    } else {
      // No splits provided — fall back to equal split across all members
      finalSplits = computeEqualSplits(amount, memberIds);
    }

    const expense = await Expense.create({
      householdId: req.user.householdId,
      description,
      amount,
      currency: currency || household.currency,
      category: category || 'other',
      paidBy,
      date: date || Date.now(),
      splitType: splitType || 'equal',
      splits: finalSplits,
      notes,
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    // Emit real-time event to household room
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.householdId.toString()).emit('expense:added', { expense: populated });
      // Recompute and broadcast updated balances
      broadcastBalances(io, req.user.householdId.toString());
    }

    // Send push notification to split members
    const splitUserIds = populated.splits
      .map((s) => s.userId._id || s.userId)
      .filter((id) => id.toString() !== req.user._id.toString());

    sendPushToUsers(splitUserIds, {
      title: 'New Expense Added 💸',
      body: `${req.user.name || 'Someone'} added "${populated.description}" (${populated.currency === 'USD' ? '$' : '₹'}${populated.amount})`,
      url: '/expenses',
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.householdId.toString() !== req.user.householdId.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const { description, amount, currency, category, paidBy, date, splitType, splits, notes } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (currency) expense.currency = currency;
    if (category) expense.category = category;
    if (paidBy) expense.paidBy = paidBy;
    if (date) expense.date = date;
    if (splitType) expense.splitType = splitType;
    if (notes !== undefined) expense.notes = notes;

    if (splits && splits.length > 0) {
      // Trust the splits sent by the client
      expense.splits = splits;
    } else if (!splits) {
      // No splits provided — recompute equal across all members
      const household = await Household.findById(req.user.householdId);
      const memberIds = household.members.map((m) => m.userId);
      expense.splits = computeEqualSplits(expense.amount, memberIds);
    }

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    const io = req.app.get('io');
    if (io) {
      io.to(req.user.householdId.toString()).emit('expense:updated', { expense: populated });
      broadcastBalances(io, req.user.householdId.toString());
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    if (expense.householdId.toString() !== req.user.householdId.toString())
      return res.status(403).json({ message: 'Not authorized' });

    await expense.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(req.user.householdId.toString()).emit('expense:deleted', { expenseId: req.params.id });
      broadcastBalances(io, req.user.householdId.toString());
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper: compute and emit updated balances to room
async function broadcastBalances(io, householdId) {
  try {
    const balances = await computeBalances(householdId);
    io.to(householdId).emit('balance:updated', { balances });
  } catch (_) {}
}

// Shared balance computation (also used by balanceController)
// Calculates pairwise balances relative to targetUserId (or overall if targetUserId is omitted)
// Only unsettled splits contribute to net balances; expenses where target user is not included are skipped.
async function computeBalances(householdId, targetUserId = null) {
  const expenses = await Expense.find({ householdId })
    .populate('paidBy', 'name email avatarColor')
    .populate('splits.userId', 'name email avatarColor');

  const household = await Household.findById(householdId).populate('members.userId', 'name email avatarColor');
  if (!household) return [];

  const targetStr = targetUserId ? targetUserId.toString() : null;
  const netMap = {}; // userId -> { userId: UserDoc, net: number }

  if (targetStr) {
    // Initialize netMap for all members in household except targetUser
    for (const m of household.members) {
      if (!m.userId) continue;
      const uid = (m.userId._id || m.userId).toString();
      if (uid === targetStr) continue;
      netMap[uid] = { userId: m.userId, net: 0 };
    }
  }

  for (const exp of expenses) {
    if (!exp.paidBy) continue;
    const payerId = (exp.paidBy._id || exp.paidBy).toString();
    const unsettledSplits = exp.splits.filter((s) => !s.settled);
    if (unsettledSplits.length === 0) continue; // all settled, skip

    if (targetStr) {
      // Check if target user is included in this expense
      const isPayer = payerId === targetStr;
      const targetSplit = unsettledSplits.find(
        (s) => (s.userId?._id || s.userId).toString() === targetStr
      );

      if (!isPayer && !targetSplit) {
        // Target user is NOT included in this expense at all — skip!
        continue;
      }

      if (isPayer) {
        // Target user paid: other unsettled members in splits owe target user
        for (const split of unsettledSplits) {
          const sUid = (split.userId?._id || split.userId).toString();
          if (sUid !== targetStr && netMap[sUid]) {
            netMap[sUid].net += split.amount; // other owes target user
          }
        }
      } else if (targetSplit) {
        // Someone else paid, target user is in splits: target user owes payer
        if (netMap[payerId]) {
          netMap[payerId].net -= targetSplit.amount; // target user owes payer
        }
      }
    } else {
      // Global calculation fallback
      const unsettledTotal = unsettledSplits.reduce((sum, s) => sum + s.amount, 0);

      if (!netMap[payerId]) netMap[payerId] = { userId: exp.paidBy, net: 0 };
      netMap[payerId].net += unsettledTotal;

      for (const split of unsettledSplits) {
        const splitUserId = (split.userId?._id || split.userId).toString();
        if (!netMap[splitUserId]) netMap[splitUserId] = { userId: split.userId, net: 0 };
        if (splitUserId !== payerId) {
          netMap[splitUserId].net -= split.amount;
        } else {
          netMap[payerId].net -= split.amount;
        }
      }
    }
  }

  return Object.values(netMap);
}

// GET /api/expenses/:id
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.householdId.toString() !== req.user.householdId.toString())
      return res.status(403).json({ message: 'Not authorized' });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/expenses/:id/settle/:splitUserId
// Toggle settled status on a specific member's split — owner only
const settleSplit = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.householdId.toString() !== req.user.householdId.toString())
      return res.status(403).json({ message: 'Not authorized' });

    // Only household owner can mark splits as settled
    const household = await Household.findById(req.user.householdId);
    const myMember = household.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!myMember || myMember.role !== 'owner') {
      return res.status(403).json({ message: 'Only the household owner can mark splits as paid' });
    }

    // Find the specific split
    const split = expense.splits.find(
      (s) => s.userId.toString() === req.params.splitUserId
    );
    if (!split) return res.status(404).json({ message: 'Split not found for this member' });

    // Toggle
    split.settled = !split.settled;
    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatarColor')
      .populate('splits.userId', 'name email avatarColor');

    // Broadcast updated balances
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.householdId.toString()).emit('expense:updated', { expense: populated });
      broadcastBalances(io, req.user.householdId.toString());
    }

    // Send push notification to the member whose split was toggled
    if (split.settled && req.params.splitUserId !== req.user._id.toString()) {
      sendPushToUsers([req.params.splitUserId], {
        title: 'Payment Marked as Settled ✅',
        body: `Your share for "${populated.description}" was marked as paid!`,
        url: '/balances',
      });
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getExpenses, getExpenseById, addExpense, updateExpense, deleteExpense, settleSplit, computeBalances };
