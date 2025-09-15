import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { cleanOldData, getDb, getSensorDataByDate } from '../api/database';
import { BACKGROUND_FETCH_TASK_NAME } from '../constants/constants';
import { schedulePushNotification } from './notificationService';

TaskManager.defineTask(BACKGROUND_FETCH_TASK_NAME, async () => {
  console.log('Background fetch task started!');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const db = await getDb();
    await cleanOldData(db);

    const dataToday = await getSensorDataByDate(db, today);
    if (dataToday.length > 0) {
      const totalSaidas = dataToday.reduce((sum, record) => sum + record.numSaidas, 0);
      const totalEntradas = dataToday.reduce((sum, record) => sum + record.numEntradas, 0);
      const peakHour = 'N/A';
      const notificationBody = `Today's Summary: ${totalEntradas} bees in, ${totalSaidas} bees out.`;
      await schedulePushNotification('Beehive Daily Report', notificationBody);
    } else {
      await schedulePushNotification('Beehive Daily Report', 'No bee activity recorded today.');
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundFetchTask = async () => {
  try {
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK_NAME)) {
      console.log('Background fetch task already registered.');
      return;
    }
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK_NAME, {
      minimumInterval: 60 * 60 * 24, 
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch task registered!');
  } catch (error) {
    console.error('Failed to register background fetch task:', error);
  }
};