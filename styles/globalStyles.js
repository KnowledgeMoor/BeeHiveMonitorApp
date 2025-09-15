import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5FCFF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
     datePickerContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    dateTextLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    statusText: {
        fontSize: 18,
        marginRight: 5,
    },
    statusIndicator: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    connected: {
        color: 'green',
    },
    disconnected: {
        color: 'red',
    },
    dataCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dataText: {
        fontSize: 16,
        marginBottom: 5,
        color: '#555',
    },
    noDataText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
        color: '#888',
    },
    buttonContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    aggregateCard: {
        backgroundColor: '#E0F2F7',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        elevation: 3,
    },
    aggregateTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0288D1',
    },
    aggregateText: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    settingItem: {
        marginBottom: 20,
    },
    settingLabel: {
        fontSize: 18,
        marginBottom: 10,
        color: '#333',
    },
    retentionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
    },
    chartContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
});