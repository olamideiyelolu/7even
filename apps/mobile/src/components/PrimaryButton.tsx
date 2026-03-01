import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ui } from '../theme/ui';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary'
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      style={[
        styles.button,
        isPrimary && styles.buttonPrimary,
        isSecondary && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          (isSecondary || variant === 'ghost') && styles.textSecondary
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: ui.button.height,
    borderRadius: ui.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ui.spacing.xs
  },
  buttonPrimary: {
    backgroundColor: ui.color.primary,
    ...ui.shadow.strong
  },
  buttonSecondary: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.borderStrong,
    borderWidth: 1
  },
  buttonGhost: {
    backgroundColor: 'transparent'
  },
  buttonDisabled: {
    opacity: 0.45
  },
  text: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    letterSpacing: ui.button.letterSpacing,
    fontWeight: '800'
  },
  textSecondary: {
    color: ui.color.accent,
    fontWeight: '700'
  }
});
