import api from '../api/client';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushSubscription() {
  if (!await checkPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) return null;
  return await reg.pushManager.getSubscription();
}

export async function subscribeUserToPush() {
  if (!await checkPushSupported()) {
    throw new Error('Push notifications are not supported by your browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied.');
  }

  // Register SW
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;

  // Get VAPID key
  const { data } = await api.get('/push/vapid-key');
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

  // Subscribe
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  // Save to server
  await api.post('/push/subscribe', subscription.toJSON());
  return subscription;
}

export async function unsubscribeUserFromPush() {
  if (!await checkPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) return;
  const subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
  }
}
