import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../components/screens/HomeScreen';
import HistoryScreen from '../components/screens/HistoryScreen';
import SettingsScreen from '../components/screens/SettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Monitor de Colmeia' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Dados Históricos' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
        </Stack.Navigator>
    );
};

export default AppNavigator;