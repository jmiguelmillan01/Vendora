import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClientesListScreen from '../screens/clientes/ClientesListScreen';
import ClienteDetailScreen from '../screens/clientes/ClienteDetailScreen';
import ClienteFormScreen from '../screens/clientes/ClienteFormScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function ClientesStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { color: colors.text } }}
    >
      <Stack.Screen name="ClientesList" component={ClientesListScreen} options={{ title: 'Clientes' }} />
      <Stack.Screen name="ClienteDetail" component={ClienteDetailScreen} options={{ title: 'Cliente' }} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ title: 'Cliente' }} />
    </Stack.Navigator>
  );
}
