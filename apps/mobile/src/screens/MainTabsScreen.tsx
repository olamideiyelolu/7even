import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MatchScreen } from './MatchScreen';
import { MessagesScreen } from './MessagesScreen';
import { ProfileScreen } from './ProfileScreen';

type TabKey = 'home' | 'messages';

export function MainTabsScreen() {
  const [tab, setTab] = useState<TabKey>('home');
  const [showProfile, setShowProfile] = useState(false);

  const content = useMemo(() => {
    if (showProfile) {
      return <ProfileScreen onBack={() => setShowProfile(false)} />;
    }
    if (tab === 'messages') return <MessagesScreen />;
    return <MatchScreen onProfilePress={() => setShowProfile(true)} />;
  }, [tab, showProfile]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>{content}</View>
      {!showProfile ? (
        <View style={styles.tabBar}>
          <Pressable style={[styles.tab, tab === 'home' && styles.tabActive]} onPress={() => setTab('home')}>
            <Text style={tab === 'home' ? styles.tabTextActive : styles.tabText}>Home</Text>
          </Pressable>
          <Pressable style={[styles.tab, tab === 'messages' && styles.tabActive]} onPress={() => setTab('messages')}>
            <Text style={tab === 'messages' ? styles.tabTextActive : styles.tabText}>Messages</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4EE'
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#D6DBD4',
    backgroundColor: '#FFFFFF'
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F1F1'
  },
  tabActive: {
    backgroundColor: '#154734'
  },
  tabText: {
    color: '#3E3E3E',
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
