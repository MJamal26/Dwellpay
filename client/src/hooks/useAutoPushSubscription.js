import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  checkPushSupported,
  getPushSubscription,
  subscribeUserToPush,
} from '../utils/pushManager';

export function useAutoPushSubscription() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?._id) return;

    let isMounted = true;

    const initPush = async () => {
      try {
        const supported = await checkPushSupported();
        if (!supported || !isMounted) return;

        // If permission is already granted, ensure active subscription is synced
        if (Notification.permission === 'granted') {
          const sub = await getPushSubscription();
          if (!sub && isMounted) {
            await subscribeUserToPush();
          }
        } else if (Notification.permission === 'default') {
          // Triggers browser's native Allow / Block permission popup
          if (isMounted) {
            await subscribeUserToPush();
          }
        }
      } catch (err) {
        console.log('[Push Auto-Subscription]', err.message);
      }
    };

    const timer = setTimeout(initPush, 1000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user?._id]);
}
