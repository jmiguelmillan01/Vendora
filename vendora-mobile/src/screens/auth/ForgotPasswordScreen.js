import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as authApi from '../../api/auth';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { colors } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit() {
    setError(null);
    setCargando(true);
    try {
      await authApi.recuperar(email);
      setEnviado(true);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo procesar la solicitud.'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.titulo}>Recuperar contraseña</Text>
        <Text style={styles.subtitulo}>
          Te enviaremos un enlace a tu correo para restablecerla desde cualquier navegador.
        </Text>
      </View>

      <ErrorBanner mensaje={error} />

      {enviado ? (
        <Text style={styles.mensajeExito}>
          Si el correo existe, se envió un enlace de recuperación. Revisa tu bandeja de entrada.
        </Text>
      ) : (
        <>
          <TextField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tucorreo@ejemplo.com"
          />
          <Button title="Enviar enlace" onPress={handleSubmit} loading={cargando} />
        </>
      )}

      <Text style={styles.link} onPress={() => navigation.goBack()}>
        Volver a iniciar sesión
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary
  },
  subtitulo: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 21
  },
  mensajeExito: {
    fontSize: 15,
    color: colors.success,
    lineHeight: 21
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24
  }
});
