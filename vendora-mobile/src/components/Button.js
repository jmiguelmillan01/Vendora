import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

const VARIANTES = {
  primary: { bg: colors.primary, text: '#ffffff' },
  danger: { bg: colors.danger, text: '#ffffff' },
  outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  neutral: { bg: colors.neutralBg, text: colors.text }
};

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const paleta = VARIANTES[variant] || VARIANTES.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: paleta.bg, borderColor: paleta.border || 'transparent' },
        paleta.border ? styles.withBorder : null,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={paleta.text} />
      ) : (
        <Text style={[styles.text, { color: paleta.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  withBorder: {
    borderWidth: 1.5
  },
  text: {
    fontSize: 16,
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.85
  }
});
