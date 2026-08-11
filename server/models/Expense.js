const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  settled: { type: Boolean, default: false },
});

const expenseSchema = new mongoose.Schema(
  {
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    category: {
      type: String,
      enum: [
        'food', 'groceries', 'rent', 'utilities', 'internet',
        'transport', 'entertainment', 'health', 'shopping',
        'travel', 'subscriptions', 'other',
      ],
      default: 'other',
    },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
    splits: [splitSchema],
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
