import { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

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
        case 'quarter':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            return `Q${quarter}/${date.getFullYear()}`;
        default:
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
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

// Determinar nível de agregação baseado no período
const getAggregationLevel = (startDate, endDate) => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) {
        return { level: 'hour', format: 'time' };
    } else if (daysDiff <= 7) {
        return { level: 'day', format: 'day-month' };
    } else if (daysDiff <= 30) {
        return { level: 'day', format: 'day-month' };
    } else if (daysDiff <= 90) {
        return { level: 'week', format: 'day-month' };
    } else if (daysDiff <= 365) {
        return { level: 'month', format: 'month-year' };
    } else {
        return { level: 'quarter', format: 'quarter' };
    }
};

// Função para agregar dados por período
const aggregateData = (data, aggregationLevel) => {
    if (!data || data.length === 0) return [];
    
    const aggregated = {};
    
    data.forEach(item => {
        const itemDate = new Date(item.dataHora);
        let key;
        
        switch(aggregationLevel) {
            case 'hour':
                key = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}-${itemDate.getHours()}`;
                break;
            case 'day':
                key = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}`;
                break;
            case 'week':
                const weekStart = new Date(itemDate);
                weekStart.setDate(itemDate.getDate() - itemDate.getDay());
                key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
                break;
            case 'month':
                key = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
                break;
            case 'quarter':
                const quarter = Math.floor(itemDate.getMonth() / 3);
                key = `${itemDate.getFullYear()}-Q${quarter}`;
                break;
            default:
                key = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}`;
        }
        
        if (!aggregated[key]) {
            aggregated[key] = {
                date: itemDate,
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
            avgEntradas: item.numEntradas / item.count,
            avgSaidas: item.numSaidas / item.count
        }))
        .sort((a, b) => a.date - b.date);
};

const generateSmartLabels = (processedData, format, maxLabels = 8) => {
    const dataLength = processedData.length;
    
    if (dataLength <= maxLabels) {
        return processedData.map(item => {
            if (format === 'time') {
                return formatTime(item.date);
            } else {
                return formatDate(item.date, format);
            }
        });
    }
    
    const step = Math.ceil(dataLength / maxLabels);
    const labels = [];
    
    for (let i = 0; i < dataLength; i++) {
        if (i === 0 || i === dataLength - 1 || i % step === 0) {
            const label = format === 'time' 
                ? formatTime(processedData[i].date)
                : formatDate(processedData[i].date, format);
            labels.push(label);
        } else {
            labels.push('');
        }
    }
    
    return labels;
};

const BeeActivityChart = ({ data, startDate, endDate }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [scrollOffset, setScrollOffset] = useState(0);
    
    if (!startDate || !endDate) {
        return (
            <View style={chartStyles.container}>
                <View style={chartStyles.emptyState}>
                    <Text style={chartStyles.emptyIcon}>📅</Text>
                    <Text style={chartStyles.emptyTitle}>Selecione um Período</Text>
                    <Text style={chartStyles.emptySubtitle}>
                        Escolha as datas de início e fim para visualizar a atividade das abelhas
                    </Text>
                </View>
            </View>
        );
    }

    const { level: aggregationLevel, format: labelFormat } = getAggregationLevel(startDate, endDate);
    const processedData = aggregateData(data, aggregationLevel);
    const labels = generateSmartLabels(processedData, labelFormat);
    const displayData = zoomLevel > 1 
        ? processedData.slice(
            Math.floor(scrollOffset * processedData.length),
            Math.floor((scrollOffset + 1/zoomLevel) * processedData.length)
          )
        : processedData;
    
    const displayLabels = zoomLevel > 1
        ? labels.slice(
            Math.floor(scrollOffset * labels.length),
            Math.floor((scrollOffset + 1/zoomLevel) * labels.length)
          )
        : labels;
  
    const chartData = {
        labels: displayLabels,
        datasets: [
            {
                data: displayData.map(d => d.numEntradas),
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                strokeWidth: 3,
                withDots: displayData.length <= 20
            },
            {
                data: displayData.map(d => d.numSaidas),
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                strokeWidth: 3,
                withDots: displayData.length <= 20
            }
        ]
    };

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#f8fafc',
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0.1,
        color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
        strokeWidth: 2,
        propsForBackgroundLines: {
            strokeDasharray: '3,3',
            stroke: 'rgba(156, 163, 175, 0.4)'
        },
        propsForDots: {
            r: '4',
            strokeWidth: '1',
        },
        decimalPlaces: 0
    };
 
    const handleDataPointClick = (data) => {
        const index = data.index;
        if (index >= 0 && index < displayData.length) {
            setSelectedPoint({
                date: displayData[index].date,
                entradas: displayData[index].numEntradas,
                saidas: displayData[index].numSaidas,
                index: index
            });
            
            setTimeout(() => setSelectedPoint(null), 3000);
        }
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev * 2, 8));
    };
    
    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev / 2, 1));
        if (zoomLevel <= 2) setScrollOffset(0);
    };
    
    const handleScrollLeft = () => {
        setScrollOffset(prev => Math.max(prev - 0.1, 0));
    };
    
    const handleScrollRight = () => {
        const maxOffset = 1 - 1/zoomLevel;
        setScrollOffset(prev => Math.min(prev + 0.1, maxOffset));
    };

    return (
        <View style={chartStyles.container}>
            <View style={chartStyles.headerContainer}>
                <Text style={chartStyles.mainTitle}>🐝 Atividade das Abelhas</Text>
                <Text style={chartStyles.periodText}>
                    {formatDate(startDate)} até {formatDate(endDate)}
                </Text>
                <Text style={chartStyles.aggregationText}>
                    Agregação: {
                        aggregationLevel === 'hour' ? 'Por Hora' :
                        aggregationLevel === 'day' ? 'Por Dia' :
                        aggregationLevel === 'week' ? 'Por Semana' :
                        aggregationLevel === 'month' ? 'Por Mês' :
                        'Por Trimestre'
                    }
                </Text>
            </View>

            <View style={chartStyles.zoomControls}>
                <TouchableOpacity 
                    style={chartStyles.zoomButton} 
                    onPress={handleZoomOut}
                    disabled={zoomLevel === 1}
                >
                    <Text style={chartStyles.zoomButtonText}>🔍-</Text>
                </TouchableOpacity>
                
                <Text style={chartStyles.zoomLevel}>Zoom: {zoomLevel}x</Text>
                
                <TouchableOpacity 
                    style={chartStyles.zoomButton} 
                    onPress={handleZoomIn}
                    disabled={zoomLevel === 8}
                >
                    <Text style={chartStyles.zoomButtonText}>🔍+</Text>
                </TouchableOpacity>
            </View>
            
            {zoomLevel > 1 && (
                <View style={chartStyles.navigationControls}>
                    <TouchableOpacity 
                        style={chartStyles.navButton} 
                        onPress={handleScrollLeft}
                        disabled={scrollOffset === 0}
                    >
                        <Text style={chartStyles.navButtonText}>◀</Text>
                    </TouchableOpacity>
                    
                    <View style={chartStyles.scrollIndicator}>
                        <View 
                            style={[
                                chartStyles.scrollThumb,
                                {
                                    width: `${100/zoomLevel}%`,
                                    left: `${scrollOffset * 100}%`
                                }
                            ]}
                        />
                    </View>
                    
                    <TouchableOpacity 
                        style={chartStyles.navButton} 
                        onPress={handleScrollRight}
                        disabled={scrollOffset >= 1 - 1/zoomLevel}
                    >
                        <Text style={chartStyles.navButtonText}>▶</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={chartStyles.legendContainer}>
                <View style={chartStyles.legendItem}>
                    <View style={[chartStyles.legendDot, { backgroundColor: '#22c55e' }]} />
                    <Text style={chartStyles.legendText}>Entradas</Text>
                </View>
                <View style={chartStyles.legendItem}>
                    <View style={[chartStyles.legendDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={chartStyles.legendText}>Saídas</Text>
                </View>
            </View>

            {selectedPoint && (
                <View style={[chartStyles.tooltip, { left: 20 + (selectedPoint.index / displayData.length) * (screenWidth - 60) }]}>
                    <Text style={chartStyles.tooltipDate}>
                        {formatDate(selectedPoint.date, 'full')}
                    </Text>
                    <Text style={chartStyles.tooltipValue}>
                        ↗ Entradas: {selectedPoint.entradas}
                    </Text>
                    <Text style={chartStyles.tooltipValue}>
                        ↘ Saídas: {selectedPoint.saidas}
                    </Text>
                </View>
            )}

            <View style={chartStyles.chartSection}>
                <ScrollView 
                    horizontal={zoomLevel > 1}
                    showsHorizontalScrollIndicator={false}
                >
                    <LineChart
                        data={chartData}
                        width={screenWidth - 40}
                        height={300}
                        chartConfig={chartConfig}
                        style={chartStyles.chart}
                        bezier
                        withShadow={false}
                        withInnerLines={true}
                        withVerticalLines={true}
                        fromZero={false}
                        verticalLabelRotation={45}
                        onDataPointClick={handleDataPointClick}
                        getDotColor={(dataPoint, dataPointIndex) => {
                            if (selectedPoint && selectedPoint.index === dataPointIndex) {
                                return '#fbbf24';
                            }
                            return 'transparent';
                        }}
                    />
                </ScrollView>
            </View>
            
            <View style={chartStyles.infoSection}>
                <Text style={chartStyles.infoText}>
                    💡 Toque nos pontos para ver detalhes
                </Text>
                {displayData.length > 0 && (
                    <Text style={chartStyles.summaryText}>
                        Total: {displayData.reduce((sum, d) => sum + d.numEntradas, 0)} entradas, {' '}
                        {displayData.reduce((sum, d) => sum + d.numSaidas, 0)} saídas
                    </Text>
                )}
            </View>
        </View>
    );
};

const chartStyles = {
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
        marginBottom: 20,
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
    zoomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    zoomButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginHorizontal: 10,
    },
    zoomButtonText: {
        fontSize: 18,
        color: '#374151',
    },
    zoomLevel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
        minWidth: 80,
        textAlign: 'center',
    },
    navigationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
    },
    navButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 15,
        padding: 10,
        marginHorizontal: 5,
    },
    navButtonText: {
        fontSize: 16,
        color: '#374151',
    },
    scrollIndicator: {
        flex: 1,
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        marginHorizontal: 10,
        position: 'relative',
    },
    scrollThumb: {
        position: 'absolute',
        height: 4,
        backgroundColor: '#6b7280',
        borderRadius: 2,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
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
        position: 'absolute',
        backgroundColor: '#1f2937',
        borderRadius: 8,
        padding: 10,
        top: 180,
        zIndex: 1000,
        minWidth: 150,
    },
    tooltipDate: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tooltipValue: {
        fontSize: 11,
        color: '#d1d5db',
        marginBottom: 2,
    },
    chartSection: {
        alignItems: 'center',
    },
    chart: {
        borderRadius: 12,
        marginBottom: 20,
    },
    infoSection: {
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    infoText: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 4,
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
    },
};

export default BeeActivityChart;