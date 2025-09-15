import { Text, View } from 'react-native';
import { styles } from '../styles/globalStyles';
import { formatDate, formatDisplayDate } from '../utils/dataHelpers';

const AggregateCard = ({ data, startDate, endDate }) => {
    if (!data || data.length === 0) {
        return null;
    }

    const totalEntradas = data.reduce((soma, registro) => soma + registro.numEntradas, 0);
    const totalSaidas = data.reduce((soma, registro) => soma + registro.numSaidas, 0);

    let atividadeMaxima = -1;
    let dataAtividadePico = null;

    data.forEach(registro => {
        const atividadeTotal = registro.numEntradas + registro.numSaidas;
        if (atividadeTotal > atividadeMaxima) {
            atividadeMaxima = atividadeTotal;
            dataAtividadePico = registro.dataHora; 
        }
    });

    let horaAtividadePico = 'N/A';
    if (dataAtividadePico) {
        horaAtividadePico = formatDisplayDate(new Date(dataAtividadePico));
    }

    const titulo = `Resumo de ${formatDate(startDate)} a ${formatDate(endDate)}`;

    return (
        <View style={styles.aggregateCard}>
            <Text style={styles.aggregateTitle}>{titulo}</Text>
            <Text style={styles.aggregateText}>Total de Entradas: {totalEntradas}</Text>
            <Text style={styles.aggregateText}>Total de Saídas: {totalSaidas}</Text>
            <Text style={styles.aggregateText}>Pico de Atividade: {horaAtividadePico}</Text>
        </View>
    );
};

export default AggregateCard;