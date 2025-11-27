import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width: screenWidth } = Dimensions.get('window');

const formatDate = (date, format = 'full') => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Data inválida';
    }
    
    switch(format) {
        case 'day-month':
            return date.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short'
            }).replace('.', '');
        case 'month':
            return date.toLocaleDateString('pt-BR', {
                month: 'short'
            }).replace('.', '');
        case 'month-year':
            return date.toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit'
            }).replace('.', '');
        case 'year':
            return date.toLocaleDateString('pt-BR', {
                year: 'numeric'
            });
        default: 
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
    }
};

const formatTime = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--';
    }
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getAggregationLevel = (startDate, endDate) => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const daysDiff = hoursDiff / 24;
    const yearsDiff = daysDiff / 365.25;

    if (hoursDiff < 2) {
        return { level: 'minute', format: 'time' }; 
    }
    if (daysDiff <= 2) {
        return { level: 'hour', format: 'time' };
    }
    if (daysDiff <= 90) {
        return { level: 'day', format: 'day-month' };
    }
    if (yearsDiff <= 2) {
        return { level: 'week', format: 'day-month' };
    }
    return { level: 'month', format: 'month-year' };
};

const aggregateData = (data, aggregationLevel) => {
    if (!data || data.length === 0) return [];
    
    const aggregated = {};
    
    data.forEach(item => {
        const itemDate = new Date(item.dataHora);
        if (isNaN(itemDate.getTime())) return;

        let key;
        let keyDate;

        switch(aggregationLevel) {
            case 'minute': {
                const minuteBucket = Math.floor(itemDate.getMinutes() / 5) * 5;
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), itemDate.getHours(), minuteBucket, 0, 0);
                key = keyDate.toISOString();
                break;
            }
            case 'hour': {
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), itemDate.getHours(), 0, 0, 0);
                key = keyDate.toISOString();
                break;
            }
            case 'day': {
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), 0, 0, 0, 0);
                key = keyDate.toISOString();
                break;
            }
            case 'week': {
                const dayOfWeek = itemDate.getDay(); 
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate() - dayOfWeek, 0, 0, 0, 0);
                key = keyDate.toISOString();
                break;
            }
            case 'month': {
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), 1, 0, 0, 0, 0);
                key = keyDate.toISOString();
                break;
            }
            default: {
                keyDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate(), 0, 0, 0, 0);
                key = keyDate.toISOString();
            }
        }
        
        if (!aggregated[key]) {
            aggregated[key] = {
                date: keyDate,
                numEntradas: 0,
                numSaidas: 0,
                count: 0
            };
        }
        
        aggregated[key].numEntradas += item.numEntradas || 0;
        aggregated[key].numSaidas += item.numSaidas || 0;
        aggregated[key].count++;
    });
    
    return Object.values(aggregated)
        .map(item => ({
            date: item.date,
            numEntradas: item.numEntradas,
            numSaidas: item.numSaidas,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const generateSmartLabels = (processedData, format, maxLabels = 6) => {
    const dataLength = processedData.length;
    
    if (dataLength === 0) return [];
    
    if (dataLength <= maxLabels) {
        return processedData.map(item => {
            return format === 'time' 
                ? formatTime(item.date)
                : formatDate(item.date, format);
        });
    }
    
    const step = Math.max(1, Math.floor(dataLength / maxLabels));
    const labels = [];
    
    for (let i = 0; i < dataLength; i++) {
        if (i === 0 || i === dataLength - 1 || i % step === 0) {
            labels.push(format === 'time'
                ? formatTime(processedData[i].date)
                : formatDate(processedData[i].date, format));
        } else {
            labels.push('');
        }
    }
    
    return labels;
};

const BeeActivityChart = ({ data, startDate, endDate }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);
    
    const validStartDate = startDate instanceof Date ? startDate : new Date(startDate);
    const validEndDate = endDate instanceof Date ? endDate : new Date(endDate);
    const hasValidPeriod = !isNaN(validStartDate.getTime()) && !isNaN(validEndDate.getTime());
    
    if (!hasValidPeriod || !data || data.length === 0) {
        return (
            <View style={chartStyles.container}>
                <View style={chartStyles.emptyState}>
                    <Text style={chartStyles.emptyIcon}>
                        {(!hasValidPeriod) ? '📅' : '🐝'}
                    </Text>
                    <Text style={chartStyles.emptyTitle}>
                        {(!hasValidPeriod) ? 'Selecione um Período' : 'Sem Dados'}
                    </Text>
                    <Text style={chartStyles.emptySubtitle}>
                        {(!hasValidPeriod) 
                            ? 'Escolha as datas de início e fim para visualizar a atividade.'
                            : 'Não encontramos dados de atividade para o período selecionado.'
                        }
                    </Text>
                </View>
            </View>
        );
    }

    const { level: aggregationLevel, format: labelFormat } = getAggregationLevel(validStartDate, validEndDate);
    const processedData = aggregateData(data, aggregationLevel);
    
    if (processedData.length === 0) {
          return (
             <View style={chartStyles.container}>
                 <View style={chartStyles.emptyState}>
                     <Text style={chartStyles.emptyIcon}>🐝</Text>
                     <Text style={chartStyles.emptyTitle}>Sem Dados Agregados</Text>
                     <Text style={chartStyles.emptySubtitle}>
                         Os dados brutos não resultaram em pontos de atividade para o período.
                     </Text>
                 </View>
             </View>
         );
    }
    
    const labels = generateSmartLabels(processedData, labelFormat);

    const entradasData = processedData.map((item, index) => ({
        value: item.numEntradas,
        label: labels[index] || '',
        dataPointText: '', 
        date: item.date,
        index: index
    }));

    const saidasData = processedData.map((item, index) => ({
        value: item.numSaidas,
        label: labels[index] || '',
        dataPointText: '',
        date: item.date,
        index: index
    }));

    const totalEntradas = processedData.reduce((sum, d) => sum + d.numEntradas, 0);
    const totalSaidas = processedData.reduce((sum, d) => sum + d.numSaidas, 0);
    
    const maxValue = Math.max(
        ...processedData.map(d => d.numEntradas),
        ...processedData.map(d => d.numSaidas)
    );

    const handlePointPress = (item) => {
        const pointData = processedData[item.index];
        setSelectedPoint({
            date: pointData.date,
            entradas: pointData.numEntradas,
            saidas: pointData.numSaidas,
            index: item.index
        });
        
        setTimeout(() => setSelectedPoint(null), 4000);
    };

    return (
        <View style={chartStyles.container}>
            <View style={chartStyles.headerContainer}>
                <Text style={chartStyles.mainTitle}>Atividade das Abelhas</Text>
                <Text style={chartStyles.periodText}>
                    {formatDate(validStartDate)} até {formatDate(validEndDate)}
                </Text>
                <Text style={chartStyles.aggregationText}>
                    Agregação: {
                        aggregationLevel === 'minute' ? 'Por 5 Minutos' :
                        aggregationLevel === 'hour' ? 'Por Hora' :
                        aggregationLevel === 'day' ? 'Por Dia' :
                        aggregationLevel === 'week' ? 'Por Semana' :
                        'Por Mês'
                    }
                </Text>
            </View>
            
            <View style={chartStyles.legendContainer}>
                <View style={chartStyles.legendItem}>
                    <View style={[chartStyles.legendDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={chartStyles.legendText}>Entradas</Text>
                </View>
                <View style={chartStyles.legendItem}>
                    <View style={[chartStyles.legendDot, { backgroundColor: '#F97316' }]} />
                    <Text style={chartStyles.legendText}>Saídas</Text>
                </View>
            </View>

            {selectedPoint && (
                <View style={chartStyles.tooltip}>
                    <Text style={chartStyles.tooltipDate}>
                        {labelFormat === 'time' 
                            ? `${formatDate(selectedPoint.date, 'day-month')} às ${formatTime(selectedPoint.date)}`
                            : formatDate(selectedPoint.date, 'full')
                        }
                    </Text>
                    <Text style={chartStyles.tooltipValue}>
                        <Text style={{color: '#3B82F6'}}>↗</Text> Entradas: {selectedPoint.entradas}
                    </Text>
                    <Text style={chartStyles.tooltipValue}>
                        <Text style={{color: '#F97316'}}>↘</Text> Saídas: {selectedPoint.saidas}
                    </Text>
                </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={chartStyles.chartSection}>
                    <LineChart
                        data={entradasData}
                        data2={saidasData}
                        height={280}
                        width={Math.max(screenWidth - 80, processedData.length * 40)}
                        spacing={Math.max(30, (screenWidth - 120) / Math.min(processedData.length, 10))}
                        initialSpacing={20}
                        endSpacing={20}
                        adjustToWidth={false}
                        thickness={3}
                        color="#3B82F6"
                        color2="#F97316" 
                        curved
                        hideDataPoints={processedData.length > 30}
                        dataPointsHeight={6}
                        dataPointsWidth={6}
                        dataPointsColor="#3B82F6"
                        dataPointsColor2="#F97316" 
                        startFillColor="rgba(59, 130, 246, 0.1)"
                        startFillColor2="rgba(249, 115, 22, 0.1)"
                        endFillColor="rgba(59, 130, 246, 0)"
                        endFillColor2="rgba(249, 115, 22, 0)"
                        startOpacity={0.4}
                        endOpacity={0.1}
                        areaChart
                        yAxisColor="#E5E7EB"
                        xAxisColor="#E5E7EB"
                        yAxisThickness={1}
                        xAxisThickness={1}
                        yAxisTextStyle={{
                            color: '#6B7280',
                            fontSize: 10,
                        }}
                        xAxisLabelTextStyle={{
                            color: '#6B7280',
                            fontSize: 10,
                            transform: [{ rotate: '-30deg' }],
                            width: 60,
                            textAlign: 'right',
                        }}
                        noOfSections={5}
                        maxValue={maxValue * 1.1}
                        yAxisLabelWidth={40}
                        hideRules
                        rulesColor="#F3F4F6"
                        rulesThickness={1}
                        pressEnabled
                        onPress={handlePointPress}
                        showVerticalLines={false}
                        verticalLinesColor="#F3F4F6" 
                        verticalLinesThickness={1}
                        isAnimated
                        animationDuration={800}
                        animateOnDataChange
                    />
                </View>
            </ScrollView>
            <View style={chartStyles.infoSection}>
                <Text style={chartStyles.summaryText}>
                    Total no período: {totalEntradas} entradas, {totalSaidas} saídas
                </Text>
            </View>
        </View>
    );
};

// --- ESTILOS ---

const chartStyles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    periodText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    aggregationText: {
        fontSize: 12,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 4,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    tooltip: {
        backgroundColor: '#1f2937',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 10,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 10,
    },
    tooltipDate: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    tooltipValue: {
        fontSize: 12,
        color: '#d1d5db',
        marginBottom: 2,
    },
    chartSection: {
        paddingVertical: 10,
    },
    infoSection: {
        alignItems: 'center',
        paddingTop: 15,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    summaryText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default BeeActivityChart;