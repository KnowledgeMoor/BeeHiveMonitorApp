import { Calendar, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/globalStyles';

const SettingsScreen = () => {
  const { cleanOldData, getRetentionSetting, setRetentionSetting } = useApp();
  const [retentionPeriod, setRetentionPeriod] = useState('1_week');

  useEffect(() => {
    getRetentionSetting().then(setRetentionPeriod);
  }, [getRetentionSetting]);

  const handleRetentionChange = async (value) => {
    setRetentionPeriod(value);
    await setRetentionSetting(value);
  };

  const handleCleanDataNow = async () => {
    try {
      const changes = await cleanOldData();
      Alert.alert('Limpeza Concluída', `${changes} registros antigos foram removidos.`);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao limpar os dados.');
    }
  };

  return (
    <ScrollView style={[styles.container, { padding: 16 }]}>
      <Text style={styles.title}>⚙️ Configurações</Text>

      <View style={{ marginVertical: 20 }}>
        <Text style={[styles.settingLabel, { marginBottom: 10 }]}>
          Período de Retenção de Dados:
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          {['1 dia', '1 semana', '1 mês'].map((period) => {
            const isSelected = retentionPeriod === period;
            return (
              <TouchableOpacity
                key={period}
                style={{
                  flex: 1,
                  backgroundColor: isSelected ? '#4CAF50' : '#E0E0E0',
                  padding: 14,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => handleRetentionChange(period)}
              >
                <Calendar color={isSelected ? 'white' : '#424242'} size={18} />
                <Text
                  style={{
                    marginLeft: 8,
                    color: isSelected ? 'white' : '#424242',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {period.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#FFC107',
          padding: 16,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 30,
        }}
        onPress={handleCleanDataNow}
      >
        <Trash2 color="black" size={20} />
        <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '600', color: 'black' }}>
          Limpar Dados Agora
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default SettingsScreen;
