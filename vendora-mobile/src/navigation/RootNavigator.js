import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { LoadingView } from '../components/LoadingView';
import AuthNavigator from './AuthNavigator';
import AppTabs from './AppTabs';

export default function RootNavigator() {
  const { autenticado, cargandoSesion } = useAuth();

  if (cargandoSesion) {
    return <LoadingView mensaje="Cargando..." />;
  }

  return <NavigationContainer>{autenticado ? <AppTabs /> : <AuthNavigator />}</NavigationContainer>;
}
