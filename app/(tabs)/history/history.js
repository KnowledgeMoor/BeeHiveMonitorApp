import { Calendar, Clock, Search } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import AggregateCard from '../../../components/AggregateCard';
import BeeActivityChart from '../../../components/BeeActivityChart';
import DataCard from '../../../components/DataCard';
import { useApp } from '../../../context/AppContext';
import { styles } from '../../../styles/globalStyles';
import { formatDisplayDate } from '../../../utils/dataHelpers';

const History = () => {
    const { getSensorDataByRange } = useApp();

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);

    const [isPickerVisible, setPickerVisible] = useState(false);
    const currentPickerTarget = useRef(null);

    const showDateTimePicker = useCallback((target) => {
        currentPickerTarget.current = target;
        setPickerVisible(true);
    }, []);

    const hideDateTimePicker = useCallback(() => {
        setPickerVisible(false);
        currentPickerTarget.current = null;
    }, []);

    const handleConfirm = useCallback((selectedDate) => {
        if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
            Alert.alert('Erro', 'Data inválida. Por favor, selecione novamente.');
            hideDateTimePicker();
            return;
        }

        if (currentPickerTarget.current === 'start') {
            setStartDate(selectedDate);
        } else {
            setEndDate(selectedDate);
        }

        hideDateTimePicker();
    }, [hideDateTimePicker]);

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) {
            Alert.alert('Datas Ausentes', 'Por favor, selecione a data inicial e final.');
            return;
        }

        if (startDate.getTime() >= endDate.getTime()) {
            Alert.alert('Intervalo Inválido', 'A data inicial deve ser anterior à data final.');
            return;
        }

        try {
            const data = await getSensorDataByRange(startDate, endDate);
            setHistoricalData(data);
            if (data.length === 0) {
                Alert.alert('Nenhum Dado', 'Nenhum dado encontrado para o período selecionado.');
            }
        } catch (error) {
            console.error('Erro ao buscar dados históricos:', error);
            Alert.alert('Erro', 'Falha ao buscar dados.');
        }
    }, [startDate, endDate, getSensorDataByRange]);

    const lastTenData = historicalData.slice(Math.max(historicalData.length - 10, 0));

    
    return (
        <ScrollView style={[styles.container, { padding: 16 }]}>
            <Text style={styles.title}>Dados Históricos da Colmeia</Text>

            <View style={{ marginVertical: 12, gap: 12 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#E3F2FD',
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                    onPress={() => showDateTimePicker('start')}
                >
                    <Calendar color="#1976D2" size={20} />
                    <Text style={{ marginLeft: 10, fontSize: 16 }}>
                        Início: {formatDisplayDate(startDate)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        backgroundColor: '#E3F2FD',
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                    onPress={() => showDateTimePicker('end')}
                >
                    <Clock color="#1976D2" size={20} />
                    <Text style={{ marginLeft: 10, fontSize: 16 }}>
                        Fim: {formatDisplayDate(endDate)}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        backgroundColor: '#4CAF50',
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onPress={fetchData}
                >
                    <Search color="white" size={20} />
                    <Text style={{ marginLeft: 10, fontSize: 16, color: 'white', fontWeight: '600' }}>
                        Buscar Dados
                    </Text>
                </TouchableOpacity>
            </View>

            <DateTimePickerModal
                isVisible={isPickerVisible}
                mode="datetime"
                is24Hour={true}
                onConfirm={handleConfirm}
                onCancel={hideDateTimePicker}
            />

            {historicalData.length > 0 ? (
                <>
                    <AggregateCard data={historicalData} startDate={startDate} endDate={endDate} />
                    <BeeActivityChart data={historicalData} startDate={startDate} endDate={endDate} />
                    
                    <Text style={styles.sectionTitle}>Últimos Dados Brutos (Máx. 10):</Text>

                    {lastTenData.map((item) => (
                        <DataCard key={item.id || item.dataHora} data={item} />
                    ))}
                    
                    {historicalData.length > 10 && (
                        <Text style={{ fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8 }}>
                            ... Exibindo apenas os últimos 10 de {historicalData.length} registros totais.
                        </Text>
                    )}
                </>
            ) : (
                <Text style={styles.noDataText}>
                    Selecione um intervalo de datas e busque os dados para ver os resultados.
                </Text>
            )}
        </ScrollView>
    );
};

export default History;