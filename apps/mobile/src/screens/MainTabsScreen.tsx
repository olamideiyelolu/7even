import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchScreen } from './MatchScreen';
import { MessagesScreen } from './MessagesScreen';
import { ProfileScreen } from './ProfileScreen';
import { PartnerProfileScreen } from './PartnerProfileScreen';
import { ui } from '../theme/ui';

type TabKey = 'home' | 'messages';

export function MainTabsScreen() {
  const [tab, setTab] = useState<TabKey>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);

  const content = useMemo(() => {
    if (showProfile) {
      return <ProfileScreen onBack={() => setShowProfile(false)} />;
    }
    if (showPartnerProfile) {
      return <PartnerProfileScreen onBack={() => setShowPartnerProfile(false)} />;
    }
    if (tab === 'messages') return <MessagesScreen />;
    return (
      <MatchScreen
        onProfilePress={() => setShowProfile(true)}
        onMessagesPress={() => setTab('messages')}
        onMatchProfilePress={() => setShowPartnerProfile(true)}
      />
    );
  }, [tab, showProfile, showPartnerProfile]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>
      {!showProfile && !showPartnerProfile ? (
        <View style={styles.tabBar}>
          <Pressable style={styles.tab} onPress={() => setTab('home')}>
            <Text style={[styles.tabText, tab === 'home' && styles.tabTextActive]}>HOME</Text>
          </Pressable>
          <Pressable style={[styles.tab, styles.tabDivider]} onPress={() => setTab('messages')}>
            <Text style={[styles.tabText, tab === 'messages' && styles.tabTextActive]}>MESSAGES</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.color.bg
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    height: 78,
    borderTopWidth: 1,
    borderTopColor: ui.color.border,
    backgroundColor: ui.color.surface,
    paddingBottom: 10
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  tabDivider: {
    borderLeftWidth: 1,
    borderLeftColor: ui.color.border
  },
  tabText: {
    color: ui.color.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  tabTextActive: {
    color: ui.color.accent,
    fontWeight: '800'
  }
});
