import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { MatchResponse, SuggestionItemResponse, SuggestionResponse } from '../types/api';
import { ui } from '../theme/ui';

interface Props {
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
  onMatchProfilePress?: () => void;
}

export function MatchScreen({ onProfilePress, onMessagesPress, onMatchProfilePress }: Props) {
  const { accessToken, logout } = useAuth();
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [suggestions, setSuggestions] = useState<SuggestionItemResponse[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestedOnce, setSuggestedOnce] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const current = await apiRequest<MatchResponse | null>('/matches/current', undefined, accessToken);
      setMatch(current);
      setSuggestionError(null);
      if (!current) {
        setSuggestions([]);
        setSuggestedOnce(false);
      }
    } catch {
      setMatch(null);
    }
  }, [accessToken]);

  const loadSuggestions = useCallback(async () => {
    if (!accessToken || !match?._id) return;
    setSuggesting(true);
    setSuggestionError(null);
    setSuggestedOnce(true);
    try {
      const result = await apiRequest<SuggestionResponse | null>(
        `/matches/${match._id}/suggestions`,
        undefined,
        accessToken
      );
      setSuggestions(result?.items ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load date ideas.';
      setSuggestionError(message || 'Failed to load date ideas.');
      setSuggestions([]);
    } finally {
      setSuggesting(false);
    }
  }, [accessToken, match?._id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sundayCountdown = useMemo(() => {
    if (match) return null;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset'
    });

    const parts = formatter.formatToParts(new Date(nowMs));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? '';

    if (get('weekday') !== 'Sun') return null;

    const hour = Number(get('hour') || '0');
    const minute = Number(get('minute') || '0');
    const second = Number(get('second') || '0');
    const secondsSinceMidnight = hour * 3600 + minute * 60 + second;
    if (secondsSinceMidnight >= 19 * 3600) return null;

    const tzName = get('timeZoneName');
    const offsetMatch = tzName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
    if (!offsetMatch) return null;
    const rawHours = Number(offsetMatch[1]);
    const rawMinutes = Number(offsetMatch[2] ?? '0');
    const sign = rawHours >= 0 ? '+' : '-';
    const absHours = Math.abs(rawHours).toString().padStart(2, '0');
    const absMinutes = Math.abs(rawMinutes).toString().padStart(2, '0');
    const offset = `${sign}${absHours}:${absMinutes}`;

    const releaseMs = Date.parse(`${get('year')}-${get('month')}-${get('day')}T19:00:00${offset}`);
    const remainingSeconds = Math.max(0, Math.floor((releaseMs - nowMs) / 1000));

    return {
      h: Math.floor(remainingSeconds / 3600),
      m: Math.floor((remainingSeconds % 3600) / 60),
      s: remainingSeconds % 60
    };
  }, [match, nowMs]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topRule} />

      <View style={styles.header}>
        {!!onProfilePress && (
          <Pressable style={styles.profileButton} onPress={onProfilePress}>
            <Text style={styles.link}>PROFILE</Text>
          </Pressable>
        )}
        <Text style={styles.logo}>7even</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          {!!match?.matchedWith ? (
            <>
              <Text style={styles.statusTitle}>YOUR MATCH</Text>
              <Pressable style={styles.matchCard} onPress={onMatchProfilePress}>
                {!!match.matchedWith.profilePhotoUrl ? (
                  <Image source={{ uri: match.matchedWith.profilePhotoUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {match.matchedWith.fullName?.trim().charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.matchName}>{match.matchedWith.fullName}</Text>
                {!!match.matchedWith.school && (
                  <Text style={styles.matchMeta}>{match.matchedWith.school}</Text>
                )}
                <Text style={styles.matchHint}>Tap to view profile</Text>
              </Pressable>
              <Pressable style={styles.primaryAction} onPress={onMessagesPress}>
                <Text style={styles.primaryActionText}>OPEN CHAT</Text>
              </Pressable>

              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionTitle}>DATE IDEA</Text>
                <Pressable style={styles.secondaryAction} onPress={loadSuggestions} disabled={suggesting}>
                  <Text style={styles.secondaryActionText}>
                    {suggesting ? 'LOADING IDEAS...' : 'SUGGEST DATE IDEAS'}
                  </Text>
                </Pressable>
                {!!suggestionError && <Text style={styles.errorText}>{suggestionError}</Text>}
                {suggestedOnce && !suggesting && suggestions.length === 0 && !suggestionError && (
                  <Text style={styles.emptyText}>No Chicago events found for this week. Try again soon.</Text>
                )}
                {suggestions.map((suggestion, index) => (
                  <View key={`${suggestion.venueEventId ?? suggestion.name}-${index}`} style={styles.suggestionRow}>
                    <Text style={styles.suggestionName}>{suggestion.name}</Text>
                    <Text style={styles.suggestionMeta}>
                      {suggestion.locationLabel ?? suggestion.venueName ?? 'Chicago'}
                    </Text>
                    <Text style={styles.suggestionMeta}>
                      {suggestion.startsAt
                        ? new Date(suggestion.startsAt).toLocaleString()
                        : suggestion.priceLabel ?? 'This week'}
                    </Text>
                    <Text style={styles.suggestionMeta}>
                      {(suggestion.priceLabel ?? 'Varies') + ` · ${suggestion.source.toUpperCase()}`}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : sundayCountdown ? (
            <>
              <Text style={styles.statusIcon}>⏳</Text>
              <Text style={styles.statusTitle}>MATCHES RELEASE SUNDAY 7:00 PM CT</Text>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>
                  {`${sundayCountdown.h.toString().padStart(2, '0')}:${sundayCountdown.m
                    .toString()
                    .padStart(2, '0')}:${sundayCountdown.s.toString().padStart(2, '0')}`}
                </Text>
                <Text style={styles.countdownLabel}>TIME REMAINING</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.statusIcon}>🔎</Text>
              <Text style={styles.statusTitle}>NO ACTIVE MATCH</Text>
              <Text style={styles.statusBody}>Check back Sunday for your next match.</Text>
            </>
          )}
        </View>

        <Pressable onPress={logout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ui.color.bg
  },
  topRule: {
    height: 7,
    backgroundColor: ui.color.topRule
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
    minHeight: 72,
    position: 'relative'
  },
  profileButton: {
    position: 'absolute',
    right: 18,
    top: 0
  },
  logo: {
    color: ui.color.textPrimary,
    fontSize: 56,
    fontWeight: '800'
  },
  link: {
    marginTop: 6,
    color: ui.color.accent,
    letterSpacing: 2,
    fontWeight: '700'
  },
  countdownCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.soft
  },
  countdownNumber: {
    color: ui.color.primary,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700'
  },
  countdownLabel: {
    marginTop: 4,
    color: ui.color.accent,
    letterSpacing: 2.7,
    fontSize: 14,
    fontWeight: '800'
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 18
  },
  statusCard: {
    borderRadius: ui.radius.xl,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    paddingVertical: 26,
    paddingHorizontal: ui.spacing.lg,
    alignItems: 'center',
    ...ui.shadow.soft
  },
  statusIcon: {
    fontSize: 46,
    marginBottom: 12
  },
  statusTitle: {
    color: ui.color.accent,
    letterSpacing: 2,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  statusBody: {
    marginTop: 14,
    color: ui.color.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24
  },
  primaryAction: {
    marginTop: 20,
    width: '100%',
    height: ui.button.height,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.strong
  },
  primaryActionText: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    letterSpacing: ui.button.letterSpacing,
    fontWeight: '800'
  },
  matchCard: {
    marginTop: 18,
    width: '100%',
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.card,
    padding: 14,
    alignItems: 'center',
    gap: 4
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: ui.color.border,
    marginBottom: 8
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    color: ui.color.accent,
    fontSize: 28,
    fontWeight: '800'
  },
  matchName: {
    color: ui.color.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center'
  },
  matchMeta: {
    color: ui.color.textMuted,
    fontSize: 14,
    textAlign: 'center'
  },
  matchHint: {
    color: ui.color.accent,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '700'
  },
  suggestionSection: {
    marginTop: 20,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: ui.color.border,
    paddingTop: 14,
    gap: 10
  },
  suggestionTitle: {
    color: ui.color.accent,
    fontSize: 13,
    letterSpacing: 2.2,
    fontWeight: '800'
  },
  suggestionRow: {
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.card,
    padding: 10
  },
  suggestionName: {
    color: ui.color.accent,
    fontSize: 14,
    fontWeight: '700'
  },
  suggestionMeta: {
    marginTop: 2,
    color: '#8C8578',
    fontSize: 13
  },
  secondaryAction: {
    marginTop: 2,
    width: '100%',
    height: 42,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryActionText: {
    color: ui.color.accent,
    letterSpacing: 1.4,
    fontWeight: '800',
    fontSize: 13
  },
  errorText: {
    color: '#AE3B3B',
    fontSize: 13
  },
  emptyText: {
    color: ui.color.textMuted,
    fontSize: 13
  },
  logoutText: {
    textAlign: 'center',
    color: ui.color.textMuted,
    fontSize: ui.type.tiny,
    letterSpacing: 2.2,
    fontWeight: '700'
  }
});
