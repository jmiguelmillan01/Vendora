import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function TextField({ label, error, style, secureTextEntry, ...props }) {
  const [mostrarTexto, setMostrarTexto] = useState(false);
  const esCampoPassword = Boolean(secureTextEntry);

  // Los campos de contraseña usan una caja única con la etiqueta apilada
  // arriba del valor y el ojo centrado sobre toda la caja; el resto de
  // campos del formulario mantiene la etiqueta separada, como siempre.
  if (esCampoPassword) {
    return (
      <View style={styles.container}>
        <View style={[styles.boxPassword, error && styles.inputError]}>
          {label ? <Text style={styles.labelInterno}>{label}</Text> : null}
          <TextInput
            style={styles.inputPassword}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!mostrarTexto}
            {...props}
          />
          <Pressable
            onPress={() => setMostrarTexto((v) => !v)}
            style={styles.botonOjo}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.iconoOjo}>{mostrarTexto ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface
  },
  boxPassword: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    paddingRight: 44,
    justifyContent: 'center'
  },
  labelInterno: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2
  },
  inputPassword: {
    fontSize: 16,
    color: colors.text,
    padding: 0
  },
  botonOjo: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center'
  },
  iconoOjo: {
    fontSize: 18
  },
  inputError: {
    borderColor: colors.danger
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 4
  }
});
