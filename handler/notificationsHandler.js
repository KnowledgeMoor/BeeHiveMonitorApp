import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const SENSOR_DATA_KEY = '@App:LatestSensorData';

const saveSensorData = async (sensorDataJson) => {
    try {
        const dataObject = JSON.parse(sensorDataJson);
        await AsyncStorage.setItem(SENSOR_DATA_KEY, sensorDataJson);
        console.log('Data saved to AsyncStorage successfully:', dataObject.dataHora);
    } catch (error) {
        console.error('Failed to save sensor data:', error);
    }
}

export const setupForegroundHandler = () => {
  messaging().onMessage(async remoteMessage => {
    console.log('--- FOREGROUND MESSAGE RECEIVED ---');
    console.log(remoteMessage);

    const { notification, data } = remoteMessage;
    const sensorDataJson = data?.sensor_data;

    if (notification && sensorDataJson) {
        
        await displayLocalNotification(notification);
        await saveSensorData(sensorDataJson);
    }
  });
};

export const backgroundMessageHandler = async (remoteMessage) => {
    console.log('--- BACKGROUND MESSAGE RECEIVED ---');
    console.log(remoteMessage);

    const { data, notification } = remoteMessage;
    const sensorDataJson = data?.sensor_data;
    
    if (sensorDataJson) {
        await saveSensorData(sensorDataJson);
    }
    return Promise.resolve();
};

const displayLocalNotification = async (notificationContent) => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Notificacoes Colmeia',
      sound: 'default', 
    });

    await notifee.displayNotification({
        title: notificationContent.title,
        body: notificationContent.body,
        android: {
            channelId,
        },
    });
    console.log('Local Notification Displayed!');
};