import type { PushSubscription } from "web-push";

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: { title: string; body: string; url?: string }
) {
  const webpush = (await import("web-push")).default;

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth_key,
    },
  };

  return webpush.sendNotification(pushSubscription, JSON.stringify(payload));
}
