import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import {
    cleanOldData,
    getSensorDataByRange as dbGetSensorDataByRange,
    getRetentionSetting,
    getSensorDataByDate,
    initDb,
    insertSensorData,
    setRetentionSetting
} from '../api/database';
import { connectMqtt, disconnectMqtt } from '../api/mqttService';
import { registerBackgroundFetchTask } from '../services/backgroundTaskService';
import { registerForPushNotificationsAsync, schedulePushNotification } from '../services/notificationService';
import { styles } from '../styles/globalStyles';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [dbInitialized, setDbInitialized] = useState(false);
    const [latestSensorData, setLatestSensorData] = useState(null);
    const [databaseInstance, setDatabaseInstance] = useState(null); 
    const [mqttClient, setMqttClient] = useState(null);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: false,
                    }),
                });

                const db = await initDb();
                setDatabaseInstance(db); 
                setDbInitialized(true);

                await registerForPushNotificationsAsync();
                await registerBackgroundFetchTask();

                const notificationListener = Notifications.addNotificationReceivedListener(n => console.log('Notification received:', n));
                const responseListener = Notifications.addNotificationResponseReceivedListener(r => console.log('Notification response:', r));

                return () => {
                    Notifications.removeNotificationSubscription(notificationListener);
                    Notifications.removeNotificationSubscription(responseListener);
                };
            } catch (error) {
                Alert.alert('Error', 'Failed to initialize app services: ' + error.message);
            }
        };

        initializeApp();
    }, []);

    const handleMqttMessage = useCallback(async (data) => {
        setLatestSensorData(data);
        if (databaseInstance) { 
            try {
                await insertSensorData(databaseInstance, data);
                const { numEntradas = 0, numSaidas = 0, temperaturaInterna = 0 } = data;
                await schedulePushNotification(
                    'New Beehive Data',
                    `Bees: ${numEntradas} in, ${numSaidas} out | Temp: ${temperaturaInterna}°C`
                );
            } catch (error) {
                console.error('Error processing MQTT data:', error);
            }
        }
    }, [databaseInstance]);

    const handleMqttConnectionLost = useCallback(() => {
        console.log('MQTT connection lost, attempting reconnect...');
        
    }, []);

    useEffect(() => {
        if (dbInitialized) {
            const client = connectMqtt(handleMqttMessage, handleMqttConnectionLost);
            setMqttClient(client);
        }
        return () => {
            disconnectMqtt();
        };
    }, [dbInitialized, handleMqttMessage, handleMqttConnectionLost]);

    if (!dbInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Initializing app...</Text>
            </View>
        );
    }

    const value = {
        db: databaseInstance,
        getSensorDataByDate: (date) => getSensorDataByDate(databaseInstance, date),
        cleanOldData: () => cleanOldData(databaseInstance),
        getRetentionSetting,
        setRetentionSetting,
        latestSensorData,
        mqttClient,
        schedulePushNotification,
        getSensorDataByRange: (startDate, endDate) => dbGetSensorDataByRange(databaseInstance, startDate, endDate),
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};