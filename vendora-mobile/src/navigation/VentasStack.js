import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VentasListScreen from '../screens/ventas/VentasListScreen';
import VentaDetailScreen from '../screens/ventas/VentaDetailScreen';
import VentaFormScreen from '../screens/ventas/VentaFormScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function VentasStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { color: colors.text } }}
    >
      <Stack.Screen name="VentasList" component={VentasListScreen} options={{ title: 'Ventas' }} />
      <Stack.Screen name="VentaDetail" component={VentaDetailScreen} options={{ title: 'Venta' }} />
      <Stack.Screen name="VentaForm" component={VentaFormScreen} options={{ title: 'Nueva venta' }} />
    </Stack.Navigator>
  );
}
