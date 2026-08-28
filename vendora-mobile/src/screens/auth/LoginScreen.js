import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { colors } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(email, password);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo iniciar sesión.'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.titulo}>Vendora</Text>
          <Text style={styles.subtitulo}>Inicia sesión para continuar</Text>
        </View>

        <ErrorBanner mensaje={error} />

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
          placeholder="Tu contraseña"
        />

        <Button title="Iniciar sesión" onPress={handleSubmit} loading={cargando} style={{ marginTop: 8 }} />

        <View style={styles.links}>
          <Text style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
            ¿Olvidaste tu contraseña?
          </Text>
          <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
            Crear una cuenta nueva
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 48,
    marginBottom: 32
  },
  titulo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary
  },
  subtitulo: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4
  },
  links: {
    marginTop: 24,
    gap: 16,
    alignItems: 'center'
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600'
  }
});
