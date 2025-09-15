import Paho from 'paho-mqtt';
import { MQTT_BROKER_URL, MQTT_TOPIC } from '../constants/constants';

let mqttClient = null;

export const connectMqtt = (onMessageArrived, onConnectionLost) => {
  if (mqttClient && mqttClient.isConnected()) {
    console.log('MQTT client already connected.');
    return mqttClient;
  }

  mqttClient = new Paho.Client(MQTT_BROKER_URL, `clientId-${Math.random().toString(36).substring(7)}`);

  mqttClient.onConnectionLost = (responseObject) => {
    console.log('MQTT connection lost:', responseObject.errorMessage);
    onConnectionLost(responseObject);
  };

  mqttClient.onMessageArrived = (message) => {
    try {
      const data = JSON.parse(message.payloadString);
      onMessageArrived(data);
    } catch (e) {
      console.error('Error parsing MQTT message:', e);
    }
  };

  mqttClient.connect({
    onSuccess: () => {
      console.log('MQTT connected!');
      mqttClient.subscribe(MQTT_TOPIC, { qos: 2 });
    },
    onFailure: (err) => console.error('MQTT connection failed:', err.errorMessage),
    useSSL: true,
    reconnect: true,
    cleanSession: true,
  });

  return mqttClient;
};

export const disconnectMqtt = () => {
  if (mqttClient && mqttClient.isConnected()) {
    mqttClient.disconnect();
    console.log('MQTT disconnected.');
  }
  mqttClient = null;
};