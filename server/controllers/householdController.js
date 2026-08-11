const Household = require('../models/Household');
const User = require('../models/User');

// POST /api/households — Create new household
const createHousehold = async (req, res) => {
  try {
    const { name, currency } = req.body;
    if (!name) return res.status(400).json({ message: 'Household name is required' });

    if (req.user.householdId) {
      return res.status(400).json({ message: 'You already belong to a household' });
    }

    const household = await Household.create({
      name,
      currency: currency || 'INR',
      members: [{ userId: req.user._id, role: 'owner' }],
    });

    // Link user to household
    await User.findByIdAndUpdate(req.user._id, { householdId: household._id });

    const populated = await Household.findById(household._id).populate(
      'members.userId',
      'name email avatarColor'
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.to(household._id.toString()).emit('member:joined', { member: req.user });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/households/:id — Get household details
const getHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.params.id).populate(
      'members.userId',
      'name email avatarColor'
    );
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const isMember = household.members.some((m) => m.userId._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this household' });

    res.json(household);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/households/join/:code — Join via invite code
const joinHousehold = async (req, res) => {
  try {
    const { code } = req.params;
    if (req.user.householdId) {
      return res.status(400).json({ message: 'You already belong to a household' });
    }

    const household = await Household.findOne({ inviteCode: code.toUpperCase() });
    if (!household) return res.status(404).json({ message: 'Invalid invite code' });

    const alreadyMember = household.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    household.members.push({ userId: req.user._id, role: 'member' });
    await household.save();

    await User.findByIdAndUpdate(req.user._id, { householdId: household._id });

    const populated = await Household.findById(household._id).populate(
      'members.userId',
      'name email avatarColor'
    );

    const io = req.app.get('io');
    if (io) io.to(household._id.toString()).emit('member:joined', { member: req.user });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/households/members/:memberId — Remove member (owner only)
const removeMember = async (req, res) => {
  try {
    const household = await Household.findById(req.user.householdId);
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const requester = household.members.find((m) => m.userId.toString() === req.user._id.toString());
    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can remove members' });
    }

    household.members = household.members.filter(
      (m) => m.userId.toString() !== req.params.memberId
    );
    await household.save();
    await User.findByIdAndUpdate(req.params.memberId, { householdId: null });

    const io = req.app.get('io');
    if (io)
      io.to(household._id.toString()).emit('member:removed', { memberId: req.params.memberId });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/households — Update household name/currency (owner only)
const updateHousehold = async (req, res) => {
  try {
    const household = await Household.findById(req.user.householdId);
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const requester = household.members.find((m) => m.userId.toString() === req.user._id.toString());
    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can update household settings' });
    }

    if (req.body.name) household.name = req.body.name;
    if (req.body.currency) household.currency = req.body.currency;
    await household.save();

    const populated = await Household.findById(household._id).populate(
      'members.userId',
      'name email avatarColor'
    );
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/households — List all households (for join dropdown)
const listHouseholds = async (req, res) => {
  try {
    const households = await Household.find({}, '_id name currency members');
    const result = households.map((h) => ({
      _id: h._id,
      name: h.name,
      currency: h.currency,
      memberCount: h.members.length,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/households/join-select — Join a household chosen by _id (no invite code)
const joinBySelection = async (req, res) => {
  try {
    const { householdId } = req.body;
    if (!householdId) return res.status(400).json({ message: 'householdId is required' });

    if (req.user.householdId) {
      return res.status(400).json({ message: 'You already belong to a household' });
    }

    const household = await Household.findById(householdId);
    if (!household) return res.status(404).json({ message: 'Household not found' });

    const alreadyMember = household.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ message: 'Already a member' });

    household.members.push({ userId: req.user._id, role: 'member' });
    await household.save();
    await User.findByIdAndUpdate(req.user._id, { householdId: household._id });

    const populated = await Household.findById(household._id).populate(
      'members.userId',
      'name email avatarColor'
    );

    const io = req.app.get('io');
    if (io) io.to(household._id.toString()).emit('member:joined', { member: req.user });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createHousehold, getHousehold, joinHousehold, removeMember, updateHousehold, listHouseholds, joinBySelection };
