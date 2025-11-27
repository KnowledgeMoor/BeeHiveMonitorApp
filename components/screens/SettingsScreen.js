import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, BellOff, Calendar, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { styles } from '../../styles/globalStyles';

const SUBSCRIPTION_KEY = '@App:isSubscribedToTopic';

const RETENTION_MAP = {
    '1_day': '1 dia',
    '1_week': '1 semana',
    '1_month': '1 mês',
};
const RETENTION_OPTIONS = ['1_day', '1_week', '1_month']; 
const getSubscriptionStatus = async () => {
    try {
        const status = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
        return status === 'true'; 
    } catch (e) {
        console.error('Error reading subscription status from storage:', e);
        return false;
    }
};

const SettingsScreen = () => {
    const { cleanOldData, getRetentionSetting, setRetentionSetting, subscribeToTopic, unsubscribeFromTopic } = useApp();
    
    const [retentionPeriod, setRetentionPeriod] = useState('1_week'); 
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        getRetentionSetting().then(setRetentionPeriod);
        getSubscriptionStatus().then(setIsSubscribed);
    }, [getRetentionSetting]);

    const handleNotificationToggle = useCallback(async (value) => {
        const newStatus = value;
        setIsSubscribed(newStatus);

        try {
            if (newStatus) {
                await subscribeToTopic();
                Alert.alert('Notificações Ativadas', 'Você receberá notificações de novos dados da colmeia.');
            } else {
                await unsubscribeFromTopic();
                Alert.alert('Notificações Desativadas', 'Você parou de receber as notificações de dados da colmeia.');
            }
        } catch (error) {
            setIsSubscribed(!newStatus);
            Alert.alert('Erro', 'Falha ao alterar o status da notificação.');
        }
    }, [subscribeToTopic, unsubscribeFromTopic]);

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
            <Text style={styles.title}>Configurações</Text>
            
            <View style={{ marginVertical: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' }}>
                <Text style={[styles.settingLabel, { marginBottom: 10 }]}>
                    Notificações da Colmeia
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5, backgroundColor: '#F9F9F9', borderRadius: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isSubscribed ? 
                            <Bell color="#4CAF50" size={24} /> : 
                            <BellOff color="#F44336" size={24} />
                        }
                        <Text style={{ marginLeft: 15, fontSize: 16, fontWeight: '500', color: '#424242' }}>
                            Receber Alertas
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isSubscribed ? '#4CAF50' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleNotificationToggle}
                        value={isSubscribed}
                    />
                </View>
            </View>
        
            <View style={{ marginVertical: 20 }}>
                <Text style={[styles.settingLabel, { marginBottom: 10 }]}>
                    Período de Retenção de Dados:
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    {RETENTION_OPTIONS.map((periodKey) => { 
                        const isSelected = retentionPeriod === periodKey;
                        const periodLabel = RETENTION_MAP[periodKey]; 
                        return (
                            <TouchableOpacity
                                key={periodKey}
                                style={{
                                    flex: 1,
                                    backgroundColor: isSelected ? '#4CAF50' : '#E0E0E0',
                                    padding: 14,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                               
                                onPress={() => handleRetentionChange(periodKey)}><Calendar color={isSelected ? 'white' : '#424242'} size={18} />
                                <Text
                                    style={{
                                        marginLeft: 8,
                                        color: isSelected ? 'white' : '#424242',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {periodLabel}
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