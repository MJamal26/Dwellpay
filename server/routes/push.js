const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

// GET /api/push/vapid-key  — return public key to the browser
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe  — save a push subscription
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Upsert — if same endpoint re-subscribes, just update keys
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId:      req.user._id,
        householdId: req.user.householdId,
        endpoint,
        keys,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/push/unsubscribe  — remove subscription
router.delete('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
