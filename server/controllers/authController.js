const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Household = require('../models/Household');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Avatar colours for initials avatars
const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#d97706', '#059669', '#0891b2', '#0284c7',
];

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const user = await User.create({ name, email, password, avatarColor });

    res.status(201).json({
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Populate household if exists
    let household = null;
    if (user.householdId) {
      household = await Household.findById(user.householdId).populate('members.userId', 'name email avatarColor');
    }

    res.json({
      user,
      household,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    let household = null;
    if (user.householdId) {
      household = await Household.findById(user.householdId).populate('members.userId', 'name email avatarColor');
    }
    res.json({ user, household });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe };
