import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
    if(Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if(Device.isDevice) {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            throw new Error(
                'Failed to get push token for push notification!'
            );
        }
        const projectId = 
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.expoConfig?.extra?.projectId;
        if (!projectId) {
            throw new Error(
                'Project ID is not defined in app configuration.'
            );
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })
            ).data;
            return pushTokenString;
        } catch (e: unknown) {
            throw new Error(
                'Failed to get push token for push notification: ' + e
            );
        }
    } else {
        throw new Error(
            'Must use physical device for Push Notifications'
        );
    }
} 