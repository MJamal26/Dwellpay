const Expense = require('../models/Expense');

// GET /api/reports?month=2026-08
const getReports = async (req, res) => {
  try {
    const householdId = req.user.householdId;
    const { year = new Date().getFullYear() } = req.query;

    // Monthly spending for full year (bar chart)
    const monthlyData = await Expense.aggregate([
      {
        $match: {
          householdId: householdId,
          date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59`) },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Spending by category (donut chart)
    const categoryData = await Expense.aggregate([
      { $match: { householdId: householdId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Overall stats
    const allExpenses = await Expense.find({ householdId });
    const totalSpent = allExpenses.reduce((s, e) => s + e.amount, 0);
    const avgPerExpense = allExpenses.length > 0 ? totalSpent / allExpenses.length : 0;
    const largest = allExpenses.reduce((max, e) => (e.amount > max ? e.amount : max), 0);

    // Top spender (paidBy most)
    const spenderMap = {};
    for (const exp of allExpenses) {
      const pid = exp.paidBy.toString();
      spenderMap[pid] = (spenderMap[pid] || 0) + exp.amount;
    }

    res.json({
      monthly: monthlyData,
      byCategory: categoryData,
      stats: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalExpenses: allExpenses.length,
        avgPerExpense: parseFloat(avgPerExpense.toFixed(2)),
        largestExpense: largest,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReports };
