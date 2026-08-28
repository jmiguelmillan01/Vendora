import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function EmptyState({ mensaje }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center'
  },
  text: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center'
  }
});
