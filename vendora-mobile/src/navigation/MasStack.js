import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MasScreen from '../screens/mas/MasScreen';
import ProductosListScreen from '../screens/productos/ProductosListScreen';
import ProductoFormScreen from '../screens/productos/ProductoFormScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function MasStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { color: colors.text } }}
    >
      <Stack.Screen name="MasHome" component={MasScreen} options={{ title: 'Más', headerShown: false }} />
      <Stack.Screen name="ProductosList" component={ProductosListScreen} options={{ title: 'Productos y servicios' }} />
      <Stack.Screen name="ProductoForm" component={ProductoFormScreen} options={{ title: 'Producto' }} />
      <Stack.Screen name="Reportes" component={ReportesScreen} options={{ title: 'Reportes' }} />
    </Stack.Navigator>
  );
}
