const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure VAPID
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to one or more users.
 * @param {string[]} userIds  - Array of MongoDB user IDs to notify
 * @param {{ title: string, body: string, icon?: string, url?: string }} payload
 */
async function sendPushToUsers(userIds, payload) {
  if (!userIds || userIds.length === 0) return;

  const stringIds = userIds.map((id) => id.toString());
  const subs = await PushSubscription.find({ userId: { $in: stringIds } });

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    icon:  payload.icon  || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    url:   payload.url   || '/',
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        notification
      ).catch(async (err) => {
        // 410 Gone / 404 = subscription expired, clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        throw err;
      })
    )
  );

  const sent    = results.filter((r) => r.status === 'fulfilled').length;
  const failed  = results.filter((r) => r.status === 'rejected').length;
  if (sent || failed) {
    console.log(`[Push] sent=${sent} failed=${failed} for "${payload.title}"`);
  }
}

module.exports = { sendPushToUsers };
