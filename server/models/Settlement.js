const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    settledAt: { type: Date, default: null },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settlement', settlementSchema);
