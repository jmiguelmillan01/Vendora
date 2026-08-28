import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { colors } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { registrarse } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setError(null);
    setCargando(true);
    try {
      await registrarse(nombre, email, password, passwordConfirmacion);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo crear la cuenta.'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.titulo}>Crear cuenta</Text>
        <Text style={styles.subtitulo}>Tu negocio, aislado y listo en segundos</Text>
      </View>

      <ErrorBanner mensaje={error} />

      <TextField label="Nombre completo" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
      <TextField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="tucorreo@ejemplo.com"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Mínimo 6 caracteres"
      />
      <TextField
        label="Confirmar contraseña"
        value={passwordConfirmacion}
        onChangeText={setPasswordConfirmacion}
        secureTextEntry
        placeholder="Repite la contraseña"
      />

      <Button title="Crear cuenta" onPress={handleSubmit} loading={cargando} style={{ marginTop: 8 }} />

      <Text style={styles.link} onPress={() => navigation.goBack()}>
        Ya tengo una cuenta
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 24,
    marginBottom: 24
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary
  },
  subtitulo: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24
  }
});
