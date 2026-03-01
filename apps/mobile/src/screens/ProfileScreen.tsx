import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { MeResponse } from '../types/api';
import { ui } from '../theme/ui';

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

function formatLabel(value?: string) {
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
  const [schoolYear, setSchoolYear] = useState<'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate'>('freshman');
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
    if (!major.trim()) return setStatusMessage('Please enter your major.');
    if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99) {
      return setStatusMessage('Age must be a whole number from 18 to 99.');
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
      <View style={styles.topRule} />
      <PrimaryButton label="Back" variant="secondary" onPress={onBack} />

      <Text style={styles.title}>Your Profile</Text>
      {profile?.profilePhotoUrl ? (
        <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>No Photo</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.row}>Name: {profile?.fullName ?? 'Not set'}</Text>
        <Text style={styles.row}>School: {profile?.school ?? 'Not set'}</Text>
        {!editing ? (
          <>
            <Text style={styles.row}>Major: {profile?.major ?? 'Not set'}</Text>
            <Text style={styles.row}>School Year: {formatLabel(profile?.schoolYear)}</Text>
            <Text style={styles.row}>Age: {profile?.age ?? 'Not set'}</Text>
            <Text style={styles.row}>Pronouns: {formatLabel(profile?.pronouns)}</Text>
            <Text style={styles.row}>CTA Line: {profile?.ctaLine || 'Not set'}</Text>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Profile photo URL"
              placeholderTextColor={ui.color.textMuted}
              autoCapitalize="none"
              value={profilePhotoUrl}
              onChangeText={setProfilePhotoUrl}
            />
            <TextInput
              style={styles.input}
              placeholder="Major"
              placeholderTextColor={ui.color.textMuted}
              value={major}
              onChangeText={setMajor}
            />
            <Text style={styles.editLabel}>SCHOOL YEAR</Text>
            <View style={styles.optionGrid}>
              {(['freshman', 'sophomore', 'junior', 'senior', 'graduate'] as const).map((year) => {
                const selected = schoolYear === year;
                return (
                  <Pressable
                    key={year}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setSchoolYear(year)}
                  >
                    <Text style={selected ? styles.chipTextActive : styles.chipText}>{formatLabel(year)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor={ui.color.textMuted}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <Text style={styles.editLabel}>PRONOUNS</Text>
            <View style={styles.optionGrid}>
              {PRONOUN_OPTIONS.map((option) => {
                const selected = pronouns === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setPronouns(option)}
                  >
                    <Text style={selected ? styles.chipTextActive : styles.chipText}>{formatLabel(option)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.editLabel}>CTA LINE</Text>
            <View style={styles.optionGrid}>
              {CTA_OPTIONS.map((option) => {
                const selected = ctaLine === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.chip, selected && styles.chipActive]}
                    onPress={() => setCtaLine((prev) => (prev === option ? '' : option))}
                  >
                    <Text style={selected ? styles.chipTextActive : styles.chipText}>{option}</Text>
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
            variant="secondary"
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
    padding: ui.spacing.lg,
    backgroundColor: ui.color.bg
  },
  topRule: {
    height: 7,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.lg,
    marginBottom: ui.spacing.lg
  },
  title: {
    fontSize: ui.type.heading,
    fontWeight: '800',
    marginTop: ui.spacing.md,
    marginBottom: ui.spacing.md,
    color: ui.color.textPrimary
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: ui.spacing.md,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  avatarFallback: {
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarFallbackText: {
    color: ui.color.textMuted,
    fontWeight: '600'
  },
  card: {
    backgroundColor: ui.color.surface,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.color.border,
    padding: ui.spacing.md,
    gap: 10,
    ...ui.shadow.soft
  },
  row: {
    color: ui.color.textPrimary,
    fontSize: ui.type.body
  },
  input: {
    height: ui.field.height,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: ui.field.paddingX,
    backgroundColor: ui.color.card,
    color: ui.color.textPrimary,
    fontSize: ui.type.body
  },
  editLabel: {
    color: ui.color.accent,
    fontSize: ui.type.small,
    letterSpacing: 2,
    marginTop: 6,
    fontWeight: '700'
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ui.spacing.xs,
    marginBottom: ui.spacing.xs
  },
  chip: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: ui.color.card
  },
  chipActive: {
    backgroundColor: '#FBE7E4',
    borderColor: ui.color.primary
  },
  chipText: {
    color: ui.color.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  chipTextActive: {
    color: ui.color.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  status: {
    marginTop: ui.spacing.sm,
    marginBottom: ui.spacing.xs,
    color: ui.color.successText,
    fontWeight: '600'
  }
});
