import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { PartnerProfileResponse } from '../types/api';
import { ui } from '../theme/ui';

interface Props {
  onBack: () => void;
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

export function PartnerProfileScreen({ onBack }: Props) {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<PartnerProfileResponse | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void apiRequest<PartnerProfileResponse | null>(
      '/matches/current/partner-profile',
      undefined,
      accessToken
    )
      .then((res) => setProfile(res))
      .catch(() => setProfile(null));
  }, [accessToken]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRule} />
      <PrimaryButton label="Back" variant="secondary" onPress={onBack} />

      <View style={styles.profileHeader}>
        <Text style={styles.title}>{profile?.fullName ?? 'Match Profile'}</Text>
        {profile?.profilePhotoUrl ? (
          <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>No Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.row}>Name: {profile?.fullName ?? 'Not set'}</Text>
        <Text style={styles.row}>School: {profile?.school ?? 'Not set'}</Text>
        <Text style={styles.row}>Major: {profile?.major ?? 'Not set'}</Text>
        <Text style={styles.row}>School Year: {formatLabel(profile?.schoolYear)}</Text>
        <Text style={styles.row}>Age: {profile?.age ?? 'Not set'}</Text>
        <Text style={styles.row}>Pronouns: {formatLabel(profile?.pronouns)}</Text>
        <Text style={styles.row}>CTA Line: {profile?.ctaLine || 'Not set'}</Text>
      </View>
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
    height: 4,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.lg,
    marginBottom: ui.spacing.lg
  },
  title: {
    fontSize: ui.type.heading,
    fontWeight: '800',
    marginTop: ui.spacing.md,
    marginBottom: ui.spacing.md,
    color: ui.color.textPrimary,
    textAlign: 'center'
  },
  profileHeader: {
    alignItems: 'center'
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
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
  }
});
