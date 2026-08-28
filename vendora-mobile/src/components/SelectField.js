import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';

export function SelectField({ label, value, onValueChange, options, placeholder = 'Selecciona...' }) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={value} onValueChange={onValueChange} style={styles.picker}>
          <Picker.Item label={placeholder} value="" color={colors.textMuted} />
          {options.map((opcion) => (
            <Picker.Item key={String(opcion.value)} label={opcion.label} value={opcion.value} />
          ))}
        </Picker>
      </View>
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  picker: {
    ...Platform.select({
      android: { color: colors.text },
      default: {}
    })
  }
});
