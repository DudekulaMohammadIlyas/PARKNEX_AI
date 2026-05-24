import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Safely check if running in Expo Go without relying on Constants.expoConfig which is null in dev builds
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Log the current environment
if (isExpoGo) {
  console.log('[NotificationService] Running in Expo Go - Remote notifications will be skipped');
} else {
  console.log('[NotificationService] Running in Native/Dev Build - Remote notifications enabled');
}

/**
 * Configure how notifications are handled when the app is foregrounded
 */
export function configureNotificationHandler() {
  if (isExpoGo) {
    console.log('[NotificationService] Skipping notification handler configuration in Expo Go');
    return;
  }
  
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.error('[NotificationService] Error setting notification handler:', error.message);
  }
}

/**
 * Register for push notifications and return the token
 * Gracefully returns null if running in Expo Go or if permission is denied
 */
export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log('[NotificationService] Skipping push token registration in Expo Go (SDK 53+). Use a development build for remote notifications.');
    return null;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Failed to get push token for push notification!');
      return null;
    }
    
    try {
      // Use the project ID from your Expo configuration
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? 'b4822004-949d-4dd6-9e63-71823eb2581c';
      
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('[NotificationService] Push token generated:', token);
    } catch (e) {
      if (e.message && e.message.includes('FirebaseApp is not initialized')) {
        console.log('[NotificationService] Push notifications running in local simulation mode (Firebase google-services.json is not configured).');
      } else {
        console.log('[NotificationService] Skipping push token:', e.message || e);
      }
    }
  } else {
    console.log('[NotificationService] Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Set up listeners for notification events
 * @param {Function} onNotificationReceived - Callback when a notification is received
 * @param {Function} onNotificationResponse - Callback when a user interacts with a notification
 * @returns {Object} - Object containing subscriptions to be cleaned up
 */
export function setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
  const emptyListeners = {
    notificationListener: { remove: () => {} },
    responseListener: { remove: () => {} },
  };

  if (isExpoGo) {
    console.log('[NotificationService] Skipping notification listeners in Expo Go');
    return emptyListeners;
  }

  try {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('[NotificationService] Notification Received:', notification);
      if (onNotificationReceived) onNotificationReceived(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[NotificationService] Notification Response:', response);
      if (onNotificationResponse) onNotificationResponse(response);
    });

    return { notificationListener, responseListener };
  } catch (error) {
    console.warn('[NotificationService] Could not set up notification listeners:', error.message);
    return emptyListeners;
  }
}
