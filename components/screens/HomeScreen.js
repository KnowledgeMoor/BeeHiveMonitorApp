import { History, Settings, Wifi, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/globalStyles';
import DataCard from '../DataCard';

const HomeScreen = ({ navigation }) => {
  const { latestSensorData, mqttClient } = useApp();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (mqttClient) {
      const interval = setInterval(() => setIsConnected(mqttClient.isConnected()), 1000);
      return () => clearInterval(interval);
    }
  }, [mqttClient]);

  return (
    <ScrollView style={[styles.container, { padding: 16 }]}>
      <Text style={styles.title}>Dados das Colmeias</Text>
      <View
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 12,
          padding: 14,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isConnected ? (
            <Wifi color="#4CAF50" size={22} />
          ) : (
            <WifiOff color="#F44336" size={22} />
          )}
          <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '500' }}>MQTT Status</Text>
        </View>
        <View
          style={{
            backgroundColor: isConnected ? '#C8E6C9' : '#FFCDD2',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              color: isConnected ? '#2E7D32' : '#C62828',
              fontWeight: '600',
            }}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {latestSensorData ? (
        <DataCard data={latestSensorData} isLatest={true} />
      ) : (
        <Text style={styles.noDataText}>⏳ Waiting for data...</Text>
      )}

      <View style={{ marginTop: 24, gap: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#4CAF50',
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate('History')}
        >
          <History color="white" size={22} />
          <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
            Ver Histórico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings color="white" size={22} />
          <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: '600' }}>
            Configurações
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
