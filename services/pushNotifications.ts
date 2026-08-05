import { Platform } from 'react-native';
import api from './api';

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.log('Notice: Native module ExpoPushTokenManager not present in current binary client.');
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Notifications.getPermissionsAsync) {
    console.log('Push notifications unavailable: native module not linked.');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PrintEase Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#005CE6',
      });
    } catch (e) {
      // Channel handling
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '5a0e0150-f469-49fd-a67a-12d58ec5f201'
    });
    token = pushTokenData.data;
    console.log('Expo Push Token generated:', token);
  } catch (e) {
    console.log('Notice: Push Token generation handled:', e);
  }

  return token;
}

export async function savePushTokenToBackend(userId: string, token: string) {
  if (!userId || !token) return;
  try {
    await api.put(`/users/${userId}/push-token`, { token });
    console.log('Push token saved to backend for user:', userId);
  } catch (e) {
    console.log('Failed to save push token to backend:', e);
  }
}
