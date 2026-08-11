const Settlement = require('../models/Settlement');
const { computeBalances } = require('./expenseController');

// GET /api/settlements — Compute simplified settlement suggestions + history
const getSettlements = async (req, res) => {
  try {
    const householdId = req.user.householdId;

    // Completed settlements history
    const history = await Settlement.find({ householdId, status: 'completed' })
      .sort({ settledAt: -1 })
      .limit(20)
      .populate('fromUser', 'name email avatarColor')
      .populate('toUser', 'name email avatarColor');

    // Compute net balances to suggest simplification
    const balances = await computeBalances(householdId);
    const suggestions = simplifyDebts(balances);

    res.json({ suggestions, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/settlements — Create a manual settlement record
const createSettlement = async (req, res) => {
  try {
    const { toUser, amount, currency, note } = req.body;
    const settlement = await Settlement.create({
      householdId: req.user.householdId,
      fromUser: req.user._id,
      toUser,
      amount,
      currency,
      note,
    });
    const populated = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email avatarColor')
      .populate('toUser', 'name email avatarColor');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/settlements/:id/settle — Mark as paid
const markSettled = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) return res.status(404).json({ message: 'Settlement not found' });

    if (settlement.householdId.toString() !== req.user.householdId.toString())
      return res.status(403).json({ message: 'Not authorized' });

    settlement.status = 'completed';
    settlement.settledAt = new Date();
    await settlement.save();

    const populated = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email avatarColor')
      .populate('toUser', 'name email avatarColor');

    const io = req.app.get('io');
    if (io)
      io.to(req.user.householdId.toString()).emit('settlement:paid', { settlement: populated });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Greedy debt simplification algorithm
function simplifyDebts(balances) {
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ userId: b.userId, amount: Math.abs(b.net) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ userId: b.userId, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.01) {
      transactions.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: parseFloat(pay.toFixed(2)),
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transactions;
}

module.exports = { getSettlements, createSettlement, markSettled };
