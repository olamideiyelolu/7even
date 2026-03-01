import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';
import { ui } from '../theme/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type LoginField = 'email' | 'password';
type LoginErrors = Partial<Record<LoginField, string>>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): LoginErrors => {
    const next: LoginErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) next.email = 'Email is required.';
    else if (!normalizedEmail.endsWith('.edu')) next.email = 'Use a valid .edu email address.';

    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';

    return next;
  };

  const handleLogin = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await login(email.trim(), password);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topRule} />

      <View style={styles.headerBlock}>
        <Text style={styles.kicker}>WELCOME BACK</Text>
        <Text style={styles.logo}>7even</Text>
      </View>

      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}

      <View style={styles.formBlock}>
        <Text style={styles.fieldLabel}>EMAIL</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : undefined]}
          autoCapitalize="none"
          placeholder="kveloso@depaul.edu"
          placeholderTextColor={ui.color.textMuted}
          value={email}
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

        <Text style={styles.fieldLabel}>PASSWORD</Text>
        <TextInput
          style={[styles.input, errors.password ? styles.inputError : undefined]}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={ui.color.textMuted}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
      </View>

      <View style={styles.footerBlock}>
        <Pressable style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>LOG IN</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerText}>NO ACCOUNT? REGISTER HERE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ui.color.bg,
    paddingHorizontal: ui.spacing.lg,
    paddingBottom: ui.spacing.xl
  },
  topRule: {
    marginTop: ui.spacing.xs,
    height: 4,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.lg
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 56,
    marginBottom: 28
  },
  kicker: {
    color: ui.color.primary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  logo: {
    marginTop: ui.spacing.sm,
    color: ui.color.textPrimary,
    fontSize: 56,
    fontWeight: '800'
  },
  formBlock: { gap: 9 },
  fieldLabel: {
    marginTop: 10,
    color: ui.color.accent,
    fontSize: ui.type.small,
    fontWeight: '700'
  },
  input: {
    height: ui.field.height,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: ui.field.paddingX,
    backgroundColor: ui.color.surface,
    color: ui.color.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    ...ui.shadow.soft
  },
  inputError: { borderColor: ui.color.error },
  fieldError: {
    color: ui.color.error,
    marginTop: -2,
    marginBottom: 2,
    fontSize: ui.type.small,
    fontWeight: '600'
  },
  serverError: {
    color: '#7A271A',
    backgroundColor: ui.color.errorBg,
    borderColor: ui.color.errorBorder,
    borderWidth: 1,
    borderRadius: ui.radius.md,
    padding: ui.spacing.sm,
    marginBottom: 14
  },
  footerBlock: {
    marginTop: 24,
    alignItems: 'center',
    gap: 18
  },
  primaryButton: {
    width: '100%',
    height: ui.button.height,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.strong
  },
  primaryButtonText: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    fontWeight: '800'
  },
  footerText: {
    color: ui.color.textMuted,
    fontSize: 12,
    fontWeight: '700'
  }
});
