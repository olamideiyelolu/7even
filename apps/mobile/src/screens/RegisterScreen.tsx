import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
const CTA_OPTIONS = ['Red Line', 'Brown Line', 'Purple Line', 'Green Line', 'Blue Line', 'Orange Line', 'Metra', 'Bus', 'I Drive'] as const;
const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'other'] as const;
function formatPronounsLabel(value: string) {
  if (value.includes('/')) {
    return value
      .split('/')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join('/');
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

const SCHOOL_BY_DOMAIN: Array<{ school: string; domains: string[] }> = [
  { school: 'DePaul University', domains: ['depaul.edu'] },
  { school: 'University of Illinois Chicago', domains: ['uic.edu'] },
  { school: 'Roosevelt University', domains: ['roosevelt.edu'] },
  { school: 'Columbia College Chicago', domains: ['colum.edu', 'columbiachicago.edu'] },
  { school: 'Harold Washington College', domains: ['haroldwashington.edu', 'hwc.ccc.edu'] }
];

function resolveSchoolFromEmail(email: string) {
  const domain = email.toLowerCase().split('@')[1]?.trim();
  if (!domain) return null;

  for (const entry of SCHOOL_BY_DOMAIN) {
    if (entry.domains.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))) {
      return entry.school;
    }
  }
  return null;
}

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [schoolYear, setSchoolYear] = useState<'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate'>('freshman');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [ctaLine, setCtaLine] = useState<(typeof CTA_OPTIONS)[number] | ''>('');
  const [pronouns, setPronouns] = useState<(typeof PRONOUN_OPTIONS)[number]>('she/her');
  const school = resolveSchoolFromEmail(email);

  const handleRegister = async () => {
    if (!school) {
      Alert.alert(
        'Unsupported school email',
        'Please use a school email from: DePaul University, University of Illinois Chicago, Roosevelt University, Columbia College Chicago, or Harold Washington College.'
      );
      return;
    }
    if (!major.trim()) {
      Alert.alert('Missing major', 'Please enter your major.');
      return;
    }

    try {
      await register({
        email,
        password,
        fullName,
        age: 20,
        dateOfBirth: '2004-01-01',
        school,
        major: major.trim(),
        schoolYear,
        gender: 'woman',
        orientation: 'straight',
        pronouns,
        profilePhotoUrl: profilePhotoUrl.trim() || 'https://example.com/profile.jpg',
        ctaLine: ctaLine || undefined,
        preferredGenders: ['man'],
        preferredAgeMin: 18,
        preferredAgeMax: 30,
        interests: ['coffee', 'music']
      });

      Alert.alert('Registered', 'Check your OTP via backend response, verify email, then login.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder=".edu email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Major" value={major} onChangeText={setMajor} />
      <Text style={styles.optionLabel}>Pronouns</Text>
      <View style={styles.optionGrid}>
        {PRONOUN_OPTIONS.map((option) => {
          const selected = pronouns === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, selected && styles.optionChipActive]}
              onPress={() => setPronouns(option)}
            >
              <Text style={selected ? styles.optionTextActive : styles.optionText}>{formatPronounsLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.schoolYearWrap}>
        {(['freshman', 'sophomore', 'junior', 'senior', 'graduate'] as const).map((year) => (
          <PrimaryButton
            key={year}
            label={schoolYear === year ? `School Year: ${year[0].toUpperCase()}${year.slice(1)}` : `${year[0].toUpperCase()}${year.slice(1)}`}
            onPress={() => setSchoolYear(year)}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Profile photo URL (optional)"
        autoCapitalize="none"
        value={profilePhotoUrl}
        onChangeText={setProfilePhotoUrl}
      />
      <Text style={styles.optionLabel}>CTA Line (optional)</Text>
      <View style={styles.optionGrid}>
        {CTA_OPTIONS.map((option) => {
          const selected = ctaLine === option;
          return (
            <Pressable
              key={option}
              style={[styles.optionChip, selected && styles.optionChipActive]}
              onPress={() => setCtaLine((prev) => (prev === option ? '' : option))}
            >
              <Text style={selected ? styles.optionTextActive : styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.schoolBox}>
        <Text style={styles.schoolLabel}>School</Text>
        <Text style={school ? styles.schoolValue : styles.schoolValueMuted}>
          {school ?? 'Enter a supported school email to auto-select your college'}
        </Text>
      </View>
      <PrimaryButton label="Create account" onPress={handleRegister} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F6F4EE', flexGrow: 1, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  schoolBox: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9F9F9'
  },
  schoolLabel: {
    color: '#6A6A6A',
    fontSize: 12,
    marginBottom: 4
  },
  schoolValue: {
    color: '#1E2E27',
    fontSize: 15,
    fontWeight: '600'
  },
  schoolValueMuted: {
    color: '#8A8A8A',
    fontSize: 15
  },
  schoolYearWrap: {
    marginBottom: 12
  },
  optionLabel: {
    color: '#4A4A4A',
    marginBottom: 8
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  optionChip: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF'
  },
  optionChipActive: {
    backgroundColor: '#E8F0EC',
    borderColor: '#154734'
  },
  optionText: {
    color: '#2E2E2E'
  },
  optionTextActive: {
    color: '#154734',
    fontWeight: '700'
  }
});
