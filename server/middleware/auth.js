const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Household = require('../models/Household');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach hidden flag from household membership
      if (req.user.householdId) {
        const household = await Household.findById(req.user.householdId);
        if (household) {
          const membership = household.members.find(
            (m) => m.userId.toString() === req.user._id.toString()
          );
          req.user.isHidden = !!(membership?.hidden);
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
