// Expo Go on Android (SDK 53+) no longer supports expo-notifications.
// To use push notifications, a custom development build is required via EAS.
// For this class project, we will safely mock this to prevent crashes in Expo Go.

export async function registerForPushNotificationsAsync() {
  console.log('Push notifications are disabled in Expo Go for SDK 54.');
  return null;
}

export async function savePushTokenToBackend(userId: string, token: string) {
  // No-op
}
