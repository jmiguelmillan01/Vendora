import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';

function Opcion({ titulo, subtitulo, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.opcion}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.opcionSubtitulo}>{subtitulo}</Text> : null}
      </Card>
    </Pressable>
  );
}

export default function MasScreen({ navigation }) {
  const { usuario, cerrarSesion } = useAuth();

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: cerrarSesion }
    ]);
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>Más</Text>

      <Card>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </Card>

      <Opcion
        titulo="Productos y servicios"
        subtitulo="Catálogo, precios, activar/desactivar"
        onPress={() => navigation.navigate('ProductosList')}
      />
      <Opcion
        titulo="Reportes"
        subtitulo="Ventas y abonos por período"
        onPress={() => navigation.navigate('Reportes')}
      />

      <View style={styles.logoutContainer}>
        <Text style={styles.logout} onPress={handleLogout}>
          Cerrar sesión
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16
  },
  nombre: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2
  },
  opcion: {
    marginBottom: 8
  },
  opcionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  opcionSubtitulo: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  logoutContainer: {
    marginTop: 24,
    alignItems: 'center'
  },
  logout: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700'
  }
});
