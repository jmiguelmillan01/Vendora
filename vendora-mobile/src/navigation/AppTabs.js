import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardStack from './DashboardStack';
import ClientesStack from './ClientesStack';
import VentasStack from './VentasStack';
import AbonosStack from './AbonosStack';
import MasStack from './MasStack';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONOS = {
  DashboardTab: '📊',
  ClientesTab: '👥',
  VentasTab: '🧾',
  AbonosTab: '💵',
  MasTab: '⋯'
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONOS[route.name]}</Text>
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="ClientesTab" component={ClientesStack} options={{ title: 'Clientes' }} />
      <Tab.Screen name="VentasTab" component={VentasStack} options={{ title: 'Ventas' }} />
      <Tab.Screen name="AbonosTab" component={AbonosStack} options={{ title: 'Abonos' }} />
      <Tab.Screen name="MasTab" component={MasStack} options={{ title: 'Más' }} />
    </Tab.Navigator>
  );
}
