import { Text, View } from 'react-native';
import { styles } from '../styles/globalStyles';

const DataCard = ({ data, isLatest = false }) => {
    if (!data) {
        return null;
    }

    let displayDateTime = 'N/A';
    try {
        const date = new Date(data.dataHora);
        if (date instanceof Date && !isNaN(date.getTime())) {
            displayDateTime = date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        }
    } catch (error) {
        console.warn('Error formatting date:', error);
    }

    const safeDisplay = (value, suffix = '') => {
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        return `${value}${suffix}`;
    };

    return (
        <View style={styles.dataCard}>
            {isLatest ? (
                <Text style={styles.dataText}>Última atualização: {displayDateTime}</Text>
            ) : (
                <Text style={styles.dataText}>Data/Hora: {displayDateTime}</Text>
            )}
            <Text style={styles.dataText}>
                Entradas: {safeDisplay(data.numEntradas || data.num_entradas)}
            </Text>
            <Text style={styles.dataText}>
                Saídas: {safeDisplay(data.numSaidas || data.num_saidas)}
            </Text>
            <Text style={styles.dataText}>
                Temp. Interna: {safeDisplay(data.temperaturaInterna || data.temperatura_interna, '°C')}
            </Text>
            <Text style={styles.dataText}>
                Temp. Externa: {safeDisplay(data.temperaturaExterna || data.temperatura_externa, '°C')}
            </Text>
            <Text style={styles.dataText}>
                Hum. Interna: {safeDisplay(data.humidadeInterna || data.humidade_interna, '%')}
            </Text>
            <Text style={styles.dataText}>
                Hum. Externa: {safeDisplay(data.humidadeExterna || data.humidade_externa, '%')}
            </Text>
            <Text style={styles.dataText}>
                Luminosidade: {safeDisplay(data.luminosidade)}
            </Text>
        </View>
    );
};

export default DataCard;