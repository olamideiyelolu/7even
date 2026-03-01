import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';
import { ui } from '../theme/ui';

const SCHOOL_YEARS = ['freshman', 'sophomore', 'junior', 'senior', 'graduate'] as const;
const PRONOUNS = ['he/him', 'she/her', 'they/them', 'other'] as const;
type SchoolYear = (typeof SCHOOL_YEARS)[number];
type Pronoun = (typeof PRONOUNS)[number];

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword' | 'school' | 'major' | 'schoolYear' | 'pronouns';
type RegisterErrors = Partial<Record<RegisterField, string>>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [schoolYear, setSchoolYear] = useState<SchoolYear | ''>('');
  const [pronouns, setPronouns] = useState<Pronoun | ''>('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): RegisterErrors => {
    const next: RegisterErrors = {};
    const normalizedEmail = email.trim();

    if (!fullName.trim()) next.fullName = 'Full name is required.';
    if (!normalizedEmail) next.email = 'Email is required.';
    else if (!normalizedEmail.endsWith('.edu')) next.email = 'Use a valid .edu email address.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    if (!school.trim()) next.school = 'School is required.';
    if (!major.trim()) next.major = 'Major is required.';
    if (!schoolYear) next.schoolYear = 'School year is required.';
    if (!pronouns) next.pronouns = 'Pronouns are required.';
    return next;
  };

  const handleRegister = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerError(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        age: 20,
        dateOfBirth: '2004-01-01',
        school: school.trim(),
        major: major.trim(),
        schoolYear: schoolYear as SchoolYear,
        pronouns: pronouns as Pronoun,
        gender: 'woman',
        orientation: 'straight',
        profilePhotoUrl: 'https://example.com/profile.jpg',
        preferredGenders: ['man'],
        preferredAgeMin: 18,
        preferredAgeMax: 30,
        interests: ['coffee', 'music']
      });
      navigation.navigate('Login');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to create account.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.topRule} />

      <View style={styles.headerBlock}>
        <Text style={styles.kicker}>CREATE ACCOUNT</Text>
        <Text style={styles.logo}>7even</Text>
      </View>

      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}

      <View style={styles.formBlock}>
        <Text style={styles.fieldLabel}>FULL NAME</Text>
        <TextInput
          style={[styles.input, errors.fullName ? styles.inputError : undefined]}
          placeholder="Student name"
          placeholderTextColor={ui.color.textMuted}
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            if (errors.fullName) setErrors((current) => ({ ...current, fullName: undefined }));
          }}
        />
        {!!errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}

        <Text style={styles.fieldLabel}>EMAIL</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : undefined]}
          placeholder="kveloso@depaul.edu"
          placeholderTextColor={ui.color.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

        <Text style={styles.fieldLabel}>PASSWORD</Text>
        <TextInput
          style={[styles.input, errors.password ? styles.inputError : undefined]}
          placeholder="••••••••"
          placeholderTextColor={ui.color.textMuted}
          secureTextEntry
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

        <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword ? styles.inputError : undefined]}
          placeholder="••••••••"
          placeholderTextColor={ui.color.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />
        {!!errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword}</Text>}

        <Text style={styles.fieldLabel}>SCHOOL</Text>
        <TextInput
          style={[styles.input, errors.school ? styles.inputError : undefined]}
          placeholder="DePaul University"
          placeholderTextColor={ui.color.textMuted}
          value={school}
          onChangeText={(value) => {
            setSchool(value);
            if (errors.school) setErrors((current) => ({ ...current, school: undefined }));
          }}
        />
        {!!errors.school && <Text style={styles.fieldError}>{errors.school}</Text>}

        <Text style={styles.fieldLabel}>MAJOR</Text>
        <TextInput
          style={[styles.input, errors.major ? styles.inputError : undefined]}
          placeholder="Computer Science"
          placeholderTextColor={ui.color.textMuted}
          value={major}
          onChangeText={(value) => {
            setMajor(value);
            if (errors.major) setErrors((current) => ({ ...current, major: undefined }));
          }}
        />
        {!!errors.major && <Text style={styles.fieldError}>{errors.major}</Text>}

        <Text style={styles.fieldLabel}>SCHOOL YEAR</Text>
        <View style={styles.chipRow}>
          {SCHOOL_YEARS.map((yr) => (
            <Pressable
              key={yr}
              style={[styles.chip, schoolYear === yr && styles.chipActive]}
              onPress={() => {
                setSchoolYear(yr);
                if (errors.schoolYear) setErrors((current) => ({ ...current, schoolYear: undefined }));
              }}
            >
              <Text style={[styles.chipText, schoolYear === yr && styles.chipTextActive]}>
                {yr.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!errors.schoolYear && <Text style={styles.fieldError}>{errors.schoolYear}</Text>}

        <Text style={styles.fieldLabel}>PRONOUNS</Text>
        <View style={styles.chipRow}>
          {PRONOUNS.map((p) => (
            <Pressable
              key={p}
              style={[styles.chip, pronouns === p && styles.chipActive]}
              onPress={() => {
                setPronouns(p);
                if (errors.pronouns) setErrors((current) => ({ ...current, pronouns: undefined }));
              }}
            >
              <Text style={[styles.chipText, pronouns === p && styles.chipTextActive]}>
                {p.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!errors.pronouns && <Text style={styles.fieldError}>{errors.pronouns}</Text>}
      </View>

      <View style={styles.footerBlock}>
        <Pressable style={styles.primaryButton} onPress={handleRegister}>
          <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>HAVE AN ACCOUNT? LOG IN</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: ui.color.bg,
    paddingHorizontal: ui.spacing.lg,
    paddingBottom: ui.spacing.xl
  },
  topRule: {
    marginTop: ui.spacing.xs,
    height: 7,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.lg,
    marginBottom: 22
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 22
  },
  kicker: {
    color: ui.color.primary,
    fontSize: 14,
    letterSpacing: 3.4,
    fontWeight: '700'
  },
  logo: {
    marginTop: ui.spacing.sm,
    color: ui.color.textPrimary,
    fontSize: 58,
    fontWeight: '800'
  },
  formBlock: { gap: 8 },
  fieldLabel: {
    marginTop: 9,
    color: ui.color.accent,
    fontSize: ui.type.small,
    letterSpacing: 2.4,
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
    fontSize: ui.type.body,
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
    marginTop: 26,
    alignItems: 'center',
    gap: 18,
    paddingBottom: 22
  },
  primaryButton: {
    width: '100%',
    height: ui.button.height,
    borderRadius: 17,
    backgroundColor: ui.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.strong
  },
  primaryButtonText: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    letterSpacing: ui.button.letterSpacing,
    fontWeight: '800'
  },
  footerText: {
    color: ui.color.textMuted,
    fontSize: ui.type.tiny,
    letterSpacing: 2.2,
    fontWeight: '700'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    ...ui.shadow.soft
  },
  chipActive: {
    backgroundColor: ui.color.primary,
    borderColor: ui.color.primary
  },
  chipText: {
    color: ui.color.textMuted,
    fontSize: ui.type.small,
    letterSpacing: 1.8,
    fontWeight: '700'
  },
  chipTextActive: {
    color: ui.color.textOnPrimary
  }
});
