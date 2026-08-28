import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function ErrorBanner({ mensaje }) {
  if (!mensaje) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16
  },
  text: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  }
});
