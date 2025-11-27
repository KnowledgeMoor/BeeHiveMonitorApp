import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { setupForegroundHandler } from '../handler/notificationsHandler';

const GLOBAL_TOPIC = 'all_app_users';
const SUBSCRIPTION_KEY = '@App:isSubscribedToTopic';

const requestPostNotificationPermission = async () => {
    if (Platform.OS === 'android') {
        try {
            const settings = await notifee.getNotificationSettings();

            if (settings.android.alarmAlert === undefined || settings.android.alarmAlert < AndroidImportance.HIGH) {
                console.log('Solicitando permissão de Post Notification (Android 13+)...');
                await notifee.requestPermission();
            }
        } catch (e) {
            console.error("Erro ao solicitar permissão de post notification:", e);
        }
    }
};

export const subscribeToTopic = async () => { 
  try {
    await messaging().subscribeToTopic(GLOBAL_TOPIC);
    console.log(`Successfully subscribed to topic: ${GLOBAL_TOPIC}`);
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'true');
  } catch (error) {
    console.error(`Subscription failed for topic ${GLOBAL_TOPIC}:`, error);
  }
};

export const unsubscribeFromTopic = async () => {
  try {
    await messaging().unsubscribeFromTopic(GLOBAL_TOPIC);
    console.log(`Successfully unsubscribed from topic: ${GLOBAL_TOPIC}`);
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'false'); 
  } catch (error) {
    console.error(`Unsubscribe failed for topic ${GLOBAL_TOPIC}:`, error);
  }
};

export const setupFCMNotifications = async () => {
  try {
    const authorizationStatus = await messaging().requestPermission();

    const enabled =
      authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      authorizationStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('User denied notification permissions.');
      return null;
    }
    
    await requestPostNotificationPermission(); 
    const fcmToken = await messaging().getToken();
    console.log('FCM Device Token:', fcmToken);

    const isSubscribed = await AsyncStorage.getItem(SUBSCRIPTION_KEY);

    if (isSubscribed !== 'true') {
      console.log('First install detected, subscribing to topic...');
      await subscribeToTopic();
    } else {
      console.log('Already subscribed on a previous run. Skipping subscription.');
    }

    setupForegroundHandler(); 

    return fcmToken;
  } catch (e) {
    console.error('FCM Setup Failed:', e);
    return null;
  }
};