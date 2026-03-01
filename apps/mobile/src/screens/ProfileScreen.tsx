import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { MeResponse } from '../types/api';

interface Props {
  onBack: () => void;
}
const CTA_OPTIONS = ['Red Line', 'Brown Line', 'Purple Line', 'Green Line', 'Blue Line', 'Orange Line', 'Metra', 'Bus', 'I Drive'] as const;
const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'other'] as const;
function normalizeCtaLine(value?: string): (typeof CTA_OPTIONS)[number] | '' {
  if (!value) return '';
  return (CTA_OPTIONS as readonly string[]).includes(value) ? (value as (typeof CTA_OPTIONS)[number]) : '';
}
function normalizePronouns(value?: string): (typeof PRONOUN_OPTIONS)[number] {
  if (!value) return 'other';
  return (PRONOUN_OPTIONS as readonly string[]).includes(value) ? (value as (typeof PRONOUN_OPTIONS)[number]) : 'other';
}
function formatSchoolYear(value?: string) {
  if (!value) return 'Not set';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
function formatPronounsLabel(value?: string) {
  if (!value) return 'Not set';
  if (value.includes('/')) {
    return value
      .split('/')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join('/');
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function ProfileScreen({ onBack }: Props) {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [major, setMajor] = useState('');
  const [schoolYear, setSchoolYear] = useState<'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate'>(
    'freshman'
  );
  const [age, setAge] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [ctaLine, setCtaLine] = useState<(typeof CTA_OPTIONS)[number] | ''>('');
  const [pronouns, setPronouns] = useState<(typeof PRONOUN_OPTIONS)[number]>('other');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void apiRequest<MeResponse>('/me', undefined, accessToken)
      .then((res) => {
        setProfile(res);
        setMajor(res.major ?? '');
        setSchoolYear((res.schoolYear as typeof schoolYear) ?? 'freshman');
        setAge(String(res.age ?? ''));
        setProfilePhotoUrl(res.profilePhotoUrl ?? '');
        setCtaLine(normalizeCtaLine(res.ctaLine));
        setPronouns(normalizePronouns(res.pronouns));
      })
      .catch(() => undefined);
  }, [accessToken]);

  const saveProfile = async () => {
    setStatusMessage(null);
    const parsedAge = Number(age);
    if (!major.trim()) {
      setStatusMessage('Please enter your major.');
      return;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99) {
      setStatusMessage('Age must be a whole number from 18 to 99.');
      return;
    }

    try {
      setSaving(true);
      const updated = await apiRequest<MeResponse>(
        '/me',
        {
          method: 'PATCH',
          body: JSON.stringify({
            major: major.trim(),
            schoolYear,
            age: parsedAge,
            profilePhotoUrl: profilePhotoUrl.trim() || undefined,
            ctaLine: ctaLine.trim(),
            pronouns
          })
        },
        accessToken ?? undefined
      );
      setProfile(updated);
      setEditing(false);
      setStatusMessage('Profile updated.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PrimaryButton label="Back" onPress={onBack} />
      <Text style={styles.title}>Your Profile</Text>
      {profile?.profilePhotoUrl ? (
        <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>No Photo</Text>
        </View>
      )}
      <View style={styles.card}>
        <Text style={styles.row}>School: {profile?.school ?? 'Not set'}</Text>
        {!editing ? (
          <>
            <Text style={styles.row}>Major: {profile?.major ?? 'Not set'}</Text>
            <Text style={styles.row}>School Year: {formatSchoolYear(profile?.schoolYear)}</Text>
            <Text style={styles.row}>Age: {profile?.age ?? 'Not set'}</Text>
            <Text style={styles.row}>Pronouns: {formatPronounsLabel(profile?.pronouns)}</Text>
            <Text style={styles.row}>CTA Line: {profile?.ctaLine || 'Not set'}</Text>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Profile photo URL"
              autoCapitalize="none"
              value={profilePhotoUrl}
              onChangeText={setProfilePhotoUrl}
            />
            <TextInput style={styles.input} placeholder="Major" value={major} onChangeText={setMajor} />
            <Text style={styles.editLabel}>School Year</Text>
            <View style={styles.yearWrap}>
              {(['freshman', 'sophomore', 'junior', 'senior', 'graduate'] as const).map((year) => (
                <PrimaryButton
                  key={year}
                  label={schoolYear === year ? `Selected: ${year[0].toUpperCase()}${year.slice(1)}` : `${year[0].toUpperCase()}${year.slice(1)}`}
                  onPress={() => setSchoolYear(year)}
                />
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
            <Text style={styles.editLabel}>Pronouns</Text>
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
            <Text style={styles.editLabel}>CTA Line</Text>
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
          </>
        )}
      </View>
      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      {!editing ? (
        <PrimaryButton label="Edit Profile" onPress={() => setEditing(true)} />
      ) : (
        <>
          <PrimaryButton label={saving ? 'Saving...' : 'Save Changes'} onPress={() => void saveProfile()} disabled={saving} />
          <PrimaryButton
            label="Cancel"
            onPress={() => {
              setEditing(false);
              setMajor(profile?.major ?? '');
              setSchoolYear((profile?.schoolYear as typeof schoolYear) ?? 'freshman');
              setAge(String(profile?.age ?? ''));
              setProfilePhotoUrl(profile?.profilePhotoUrl ?? '');
              setCtaLine(normalizeCtaLine(profile?.ctaLine));
              setPronouns(normalizePronouns(profile?.pronouns));
            }}
            disabled={saving}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F6F4EE'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#154734'
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16
  },
  avatarFallback: {
    backgroundColor: '#D6DBD4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarFallbackText: {
    color: '#4A4A4A',
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10
  },
  row: {
    color: '#1E2E27',
    fontSize: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF'
  },
  editLabel: {
    color: '#4A4A4A',
    marginTop: 6
  },
  yearWrap: {
    marginBottom: 8
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
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
  },
  status: {
    marginTop: 12,
    marginBottom: 8,
    color: '#154734',
    fontWeight: '600'
  }
});
