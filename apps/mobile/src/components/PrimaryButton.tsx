import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({
  label,
  onPress,
  disabled = false
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#154734',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8
  },
  buttonDisabled: {
    opacity: 0.45
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
