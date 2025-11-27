import { Tabs } from 'expo-router';
import { History, Home, Settings } from 'lucide-react-native';
import React from 'react';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: '#757575',
                headerShown: true,
                animation: 'shift',
                headerShadowVisible: false,
                headerStyle: {
                    elevation: 0, // Android
                    shadowOpacity: 0, // iOS
                },
            }}
        >
            <Tabs.Screen
                name="index/index" 
                options={{ 
                    title: 'Monitor de Colmeia', 
                    tabBarLabel: 'Início',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }} 
            />
            <Tabs.Screen
                name="history/history" 
                options={{ 
                    title: 'Dados Históricos', 
                    tabBarLabel: 'Histórico',
                    tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
                }} 
            />
            <Tabs.Screen
                name="settings/settings" 
                options={{ 
                    title: 'Configurações', 
                    tabBarLabel: 'Ajustes',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }} 
            />
        </Tabs>
    );
}