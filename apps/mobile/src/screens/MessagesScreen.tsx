import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { io } from 'socket.io-client';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { API_ORIGIN } from '../config/network';
import { MatchResponse } from '../types/api';
import { ui } from '../theme/ui';

interface ChatMessage {
  _id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export function MessagesScreen() {
  const { accessToken } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void apiRequest<MatchResponse | null>('/matches/current', undefined, accessToken).then((match) => {
      setMatchId(match?._id ?? null);
      setMatchName(match?.matchedWith?.fullName ?? '');
    });
  }, [accessToken]);

  const socket = useMemo(() => {
    if (!accessToken || !matchId) return null;
    return io(API_ORIGIN, {
      transports: ['websocket'],
      auth: { token: accessToken }
    });
  }, [accessToken, matchId]);

  useEffect(() => {
    if (!socket || !accessToken || !matchId) return;

    socket.emit('chat:join', { matchId });
    socket.on('chat:new', (message: ChatMessage) => {
      setMessages((prev) => [message, ...prev]);
    });

    void apiRequest<{ items: ChatMessage[] }>(`/matches/${matchId}/messages`, undefined, accessToken).then((res) =>
      setMessages(res.items)
    );

    return () => {
      socket.disconnect();
    };
  }, [socket, matchId, accessToken]);

  const send = () => {
    if (!socket || !matchId || !text.trim()) return;
    socket.emit('chat:send', { matchId, text });
    setText('');
  };

  if (!matchId) {
    return (
      <View style={styles.container}>
        <View style={styles.topRule} />
        <Text style={styles.empty}>No active match yet. Messages will appear once you are matched.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRule} />
      <Text style={styles.headerTitle}>{matchName || 'Messages'}</Text>
      <FlatList
        data={messages}
        inverted
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
          </View>
        )}
      />
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Send a message"
        placeholderTextColor={ui.color.textMuted}
      />
      <PrimaryButton label="Send" onPress={send} disabled={!text.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.color.bg,
    padding: ui.spacing.md
  },
  topRule: {
    height: 7,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.md,
    marginBottom: ui.spacing.md
  },
  empty: {
    color: ui.color.textSecondary,
    marginTop: ui.spacing.lg,
    fontSize: ui.type.body
  },
  headerTitle: {
    color: ui.color.accent,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: ui.spacing.sm
  },
  listContent: {
    paddingBottom: ui.spacing.sm
  },
  messageBubble: {
    backgroundColor: ui.color.surface,
    padding: ui.spacing.sm,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.color.border,
    marginBottom: ui.spacing.xs,
    ...ui.shadow.soft
  },
  messageText: {
    color: ui.color.textPrimary,
    fontSize: ui.type.body
  },
  time: {
    fontSize: ui.type.tiny,
    color: ui.color.textMuted,
    marginTop: 6
  },
  input: {
    height: ui.field.height,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: ui.field.paddingX,
    marginTop: ui.spacing.xs,
    marginBottom: ui.spacing.xs,
    backgroundColor: ui.color.surface,
    color: ui.color.textPrimary,
    fontSize: ui.type.body,
    ...ui.shadow.soft
  }
});
