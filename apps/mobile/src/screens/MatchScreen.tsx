import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { MatchResponse } from '../types/api';
import { ui } from '../theme/ui';

interface SuggestionItem {
  name: string;
  type: string;
  matchedTags: string[];
}

interface Props {
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
}

export function MatchScreen({ onProfilePress, onMessagesPress }: Props) {
  const { accessToken, logout } = useAuth();
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try {
      const current = await apiRequest<MatchResponse | null>('/matches/current', undefined, accessToken);
      setMatch(current);
      if (current?._id) {
        const suggestionRes = await apiRequest<{ items: SuggestionItem[] }>(
          `/matches/${current._id}/suggestions`,
          undefined,
          accessToken
        );
        setSuggestions(suggestionRes?.items ?? []);
      } else {
        setSuggestions([]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const daysLeft = useMemo(() => {
    if (!match?.expiresAt) return 7;
    const ms = new Date(match.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [match]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topRule} />

      <View style={styles.header}>
        <Text style={styles.logo}>7even</Text>
        {!!onProfilePress && (
          <Pressable onPress={onProfilePress}>
            <Text style={styles.link}>PROFILE</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.countdownWrap}>
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownNumber}>{daysLeft}</Text>
          <Text style={styles.countdownLabel}>DAYS LEFT</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={ui.color.accent} />}
      >
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>{match ? '💬' : '🔎'}</Text>
          <Text style={styles.statusTitle}>{match ? 'MATCH READY' : 'SEARCHING FOR YOUR MATCH'}</Text>
          <Text style={styles.statusBody}>
            {match
              ? `You are matched. Status: ${match.status}. Expires ${new Date(match.expiresAt).toLocaleString()}.`
              : 'Our algorithm is finding someone who shares your Core 7. Check back soon.'}
          </Text>

          {!!match && (
            <Pressable style={styles.primaryAction} onPress={onMessagesPress}>
              <Text style={styles.primaryActionText}>OPEN CHAT</Text>
            </Pressable>
          )}

          {!!match && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>TOP 5 SUGGESTIONS</Text>
              {suggestions.slice(0, 5).map((item, idx) => (
                <View key={`${item.name}-${idx}`} style={styles.suggestionRow}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionMeta}>
                    {item.type} • {item.matchedTags.join(', ')}
                  </Text>
                </View>
              ))}
              {suggestions.length === 0 && <Text style={styles.suggestionMeta}>Suggestions are loading for your pair.</Text>}
            </View>
          )}
        </View>

        <Pressable onPress={logout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomTabs}>
        <Pressable style={styles.tab} onPress={() => void load()}>
          <Text style={[styles.tabText, styles.tabActive]}>HOME</Text>
        </Pressable>
        <Pressable style={styles.tab}>
          <Text style={styles.tabText}>DATES</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={onMessagesPress}>
          <Text style={[styles.tabText, !match ? styles.tabDisabled : undefined]}>MESSAGES</Text>
        </Pressable>
      </View>
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
    marginTop: 20,
    marginBottom: 4
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
  countdownWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14
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
    fontSize: 88,
    lineHeight: 88,
    fontWeight: '700'
  },
  countdownLabel: {
    marginTop: 4,
    color: ui.color.accent,
    letterSpacing: 2.7,
    fontSize: 14,
    fontWeight: '800'
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 18
  },
  statusCard: {
    borderRadius: ui.radius.xl,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    paddingVertical: 30,
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
  logoutText: {
    textAlign: 'center',
    color: ui.color.textMuted,
    fontSize: ui.type.tiny,
    letterSpacing: 2.2,
    fontWeight: '700'
  },
  bottomTabs: {
    height: 68,
    borderTopWidth: 2,
    borderTopColor: ui.color.borderStrong,
    flexDirection: 'row',
    backgroundColor: ui.color.bg
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: ui.color.borderStrong
  },
  tabText: {
    color: ui.color.textMuted,
    fontSize: 15,
    fontWeight: '700'
  },
  tabActive: {
    color: ui.color.accent
  },
  tabDisabled: {
    opacity: 0.5
  }
});
