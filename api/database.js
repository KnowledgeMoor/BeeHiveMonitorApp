import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { DATA_RETENTION_KEY, DB_NAME } from '../constants/constants';

let dbInstance = null; 


export const getDb = async () => {
    if (dbInstance) {
        return dbInstance;
    }
    try {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
        console.log('Database opened successfully.');
        return dbInstance;
    } catch (error) {
        console.error('Error opening database:', error);
        throw new Error(`Failed to open database: ${error.message}`);
    }
};


export const initDb = async () => {
    try {
        const db = await getDb(); 
        await db.execAsync(
            `CREATE TABLE IF NOT EXISTS sensor_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numSaidas INTEGER NOT NULL,
                numEntradas INTEGER NOT NULL,
                humidadeInterna REAL NOT NULL,
                humidadeExterna REAL NOT NULL,
                temperaturaInterna REAL NOT NULL,
                temperaturaExterna REAL NOT NULL,
                luminosidade REAL NOT NULL,
                dataHora TEXT NOT NULL
            );`
        );

        await db.execAsync(
            `CREATE INDEX IF NOT EXISTS idx_dataHora ON sensor_data (dataHora);`
        );
        
        console.log('sensor_data table verified/created and index idx_dataHora ensured.');
        return db;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw new Error(`Failed to initialize database: ${error.message}`);
    }
};


export const insertSensorData = async (db, data) => {
    if (!db) {
        throw new Error('Database instance not available for insert operation.');
    }
    try {
        const result = await db.runAsync(
            `INSERT INTO sensor_data (numSaidas, numEntradas, humidadeInterna, humidadeExterna, temperaturaInterna, temperaturaExterna, luminosidade, dataHora) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                data.numSaidas || data.num_saidas,
                data.numEntradas || data.num_entradas,
                data.humidadeInterna || data.humidade_interna,
                data.humidadeExterna || data.humidade_externa,
                data.temperaturaInterna || data.temperatura_interna,
                data.temperaturaExterna || data.temperatura_externa,
                data.luminosidade,
                data.dataHora, 
            ]
        );
        console.log('Data inserted with ID:', result.lastInsertRowId);
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error inserting data:', error);
        throw new Error(`Failed to insert sensor data: ${error.message}`);
    }
};

export const getSensorDataByDate = async (db, date) => {
    if (!db) {
        throw new Error('Database instance not available for fetching data by date.');
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error('Invalid Date object provided to getSensorDataByDate.');
    }

    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0); 
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999); 

        const result = await db.getAllAsync(
            `SELECT * FROM sensor_data WHERE dataHora BETWEEN ? AND ? ORDER BY dataHora ASC;`,
            [startOfDay.toISOString(), endOfDay.toISOString()]
        );
        return result;
    } catch (error) {
        console.error('Error fetching data by date:', error);
        throw new Error(`Failed to fetch data by date: ${error.message}`);
    }
};


export const getSensorDataByRange = async (db, startDate, endDate) => {
    if (!db) {
        throw new Error('Database instance not available for fetching data by range.');
    }

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error("Validation failed for startDate in database.js!");
        throw new Error('Invalid startDate provided; must be a valid Date object.');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.error("Validation failed for endDate in database.js!");
        throw new Error('Invalid endDate provided; must be a valid Date object.');
    }

    try {
        const startISO = startDate.toISOString(); 
        const endISO = endDate.toISOString();

        console.log(`Attempting to fetch data from ${startISO} to ${endISO}`);

        const result = await db.getAllAsync(
            `SELECT * FROM sensor_data WHERE dataHora BETWEEN ? AND ? ORDER BY dataHora ASC;`,
            [startISO, endISO]
        );
        return result;
    } catch (error) {
        console.error('Error fetching data by date range:', error);
        throw new Error(`Failed to fetch data by date range: ${error.message}`);
    }
};

export const getRetentionSetting = async () => {
    try {
        const setting = await AsyncStorage.getItem(DATA_RETENTION_KEY);
        return setting || '1_week'; 
    } catch (error) {
        console.error('Error getting retention setting from AsyncStorage:', error);
        return '1_week'; 
    }
};

export const setRetentionSetting = async (value) => {
    try {
        await AsyncStorage.setItem(DATA_RETENTION_KEY, value);
        console.log('Retention setting saved:', value);
    } catch (error) {
        console.error('Error setting retention setting in AsyncStorage:', error);
    }
};


export const cleanOldData = async (db) => {
    if (!db) {
        throw new Error('Database instance not available for cleaning old data.');
    }
    try {
        const retention = await getRetentionSetting();
        let cutoffDate = new Date(); 

        switch (retention) {
            case '1_day':
                cutoffDate.setDate(cutoffDate.getDate() - 1);
                break;
            case '1_week':
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                break;
            case '1_month':
                cutoffDate.setMonth(cutoffDate.getMonth() - 1);
                break;
            default:
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                console.warn(`Unrecognized retention setting: ${retention}. Defaulting to 1 week.`);
        }

        const result = await db.runAsync(`DELETE FROM sensor_data WHERE dataHora < ?;`, [cutoffDate.toISOString()]);
        console.log(`Deleted ${result.changes} old records based on ${retention} retention.`);
        return result.changes;
    } catch (error) {
        console.error('Error cleaning old data:', error);
        throw new Error(`Failed to clean old data: ${error.message}`);
    }
};