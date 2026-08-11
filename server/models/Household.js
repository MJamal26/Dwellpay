const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'member'], default: 'member' },
  hidden: { type: Boolean, default: false }, // ghost admin — invisible to regular members
  joinedAt: { type: Date, default: Date.now },
});

const householdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    members: [memberSchema],
    inviteCode: { type: String, unique: true, default: () => uuidv4().slice(0, 8).toUpperCase() },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Household', householdSchema);
