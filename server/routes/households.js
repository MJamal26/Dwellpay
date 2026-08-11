const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createHousehold,
  getHousehold,
  joinHousehold,
  removeMember,
  updateHousehold,
  listHouseholds,
  joinBySelection,
} = require('../controllers/householdController');

// List all households — for onboarding dropdown (requires auth, no householdId needed)
router.get('/', protect, listHouseholds);
router.get('/my', protect, (req, res) => res.redirect(`/api/households/${req.user.householdId}`));
router.get('/:id', protect, getHousehold);
router.post('/join-select', protect, joinBySelection);
router.post('/join/:code', protect, joinHousehold);
router.delete('/members/:memberId', protect, removeMember);
router.put('/', protect, updateHousehold);

module.exports = router;
