import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchScreen } from './MatchScreen';
import { MessagesScreen } from './MessagesScreen';
import { ProfileScreen } from './ProfileScreen';
import { ui } from '../theme/ui';

type TabKey = 'home' | 'messages';

export function MainTabsScreen() {
  const [tab, setTab] = useState<TabKey>('home');
  const [showProfile, setShowProfile] = useState(false);

  const content = useMemo(() => {
    if (showProfile) {
      return <ProfileScreen onBack={() => setShowProfile(false)} />;
    }
    if (tab === 'messages') return <MessagesScreen />;
    return <MatchScreen onProfilePress={() => setShowProfile(true)} onMessagesPress={() => setTab('messages')} />;
  }, [tab, showProfile]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>
      {!showProfile ? (
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
    height: 68,
    borderTopWidth: 2,
    borderTopColor: ui.color.borderStrong,
    backgroundColor: ui.color.bg
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabDivider: {
    borderLeftWidth: 1,
    borderLeftColor: ui.color.borderStrong
  },
  tabText: {
    color: ui.color.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6
  },
  tabTextActive: {
    color: ui.color.accent
  }
});
