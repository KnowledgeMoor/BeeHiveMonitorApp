import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    throw new Error('Must use physical device for Push Notifications');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    throw new Error('Failed to get push token for push notification!');
  }
  
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.extra?.projectId;
  if (!projectId) {
    throw new Error('Project ID not defined in app configuration.');
  }

  try {
    const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', pushTokenString);
    return pushTokenString;
  } catch (e) {
    throw new Error(`Failed to get push token: ${e}`);
  }
};

export const schedulePushNotification = async (title, body, trigger = null) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { timestamp: new Date().toISOString() } },
      trigger,
    });
    console.log('Notification scheduled:', title);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};