import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AbonosListScreen from '../screens/abonos/AbonosListScreen';
import AbonoFormScreen from '../screens/abonos/AbonoFormScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AbonosStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { color: colors.text } }}
    >
      <Stack.Screen name="AbonosList" component={AbonosListScreen} options={{ title: 'Abonos' }} />
      <Stack.Screen name="AbonoForm" component={AbonoFormScreen} options={{ title: 'Nuevo abono' }} />
    </Stack.Navigator>
  );
}
