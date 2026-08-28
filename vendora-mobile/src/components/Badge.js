import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ESTILOS = {
  success: { bg: colors.successBg, text: colors.success },
  danger: { bg: colors.dangerBg, text: colors.danger },
  warning: { bg: colors.warningBg, text: colors.warning },
  neutral: { bg: colors.neutralBg, text: colors.neutral }
};

const ESTADO_A_TONO = {
  PAGADA: 'success',
  PARCIAL: 'warning',
  PENDIENTE: 'danger',
  ANULADA: 'neutral',
  Activo: 'success',
  Anulado: 'neutral'
};

export function Badge({ label, tono }) {
  const tonoFinal = tono || ESTADO_A_TONO[label] || 'neutral';
  const paleta = ESTILOS[tonoFinal] || ESTILOS.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: paleta.bg }]}>
      <Text style={[styles.text, { color: paleta.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 12,
    fontWeight: '700'
  }
});
