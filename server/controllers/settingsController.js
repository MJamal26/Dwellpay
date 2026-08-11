const User = require('../models/User');

// PUT /api/settings/profile
const updateProfile = async (req, res) => {
  try {
    const { name, currency, avatarColor } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (avatarColor) user.avatarColor = avatarColor;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { updateProfile };
