import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { io } from 'socket.io-client';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { API_ORIGIN } from '../config/network';
import { MatchResponse, MeResponse } from '../types/api';
import { ui } from '../theme/ui';

interface ChatMessage {
  _id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface Props {
  onMatchProfilePress?: () => void;
}

export function MessagesScreen({ onMatchProfilePress }: Props) {
  const { accessToken } = useAuth();
  const [meId, setMeId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState('');
  const [matchPhotoUrl, setMatchPhotoUrl] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void apiRequest<MeResponse>('/me', undefined, accessToken)
      .then((me) => setMeId(me.id))
      .catch(() => setMeId(null));

    void apiRequest<MatchResponse | null>('/matches/current', undefined, accessToken).then((match) => {
      setMatchId(match?._id ?? null);
      setMatchName(match?.matchedWith?.fullName ?? '');
      setMatchPhotoUrl(match?.matchedWith?.profilePhotoUrl ?? '');
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
      <Pressable style={styles.headerRow} onPress={onMatchProfilePress} disabled={!onMatchProfilePress}>
        {matchPhotoUrl ? (
          <Image source={{ uri: matchPhotoUrl }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Text style={styles.headerAvatarInitial}>{(matchName || 'M').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.headerTitle}>{matchName || 'Messages'}</Text>
      </Pressable>
      <FlatList
        data={messages}
        inverted
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.senderName}>
              {item.senderId === meId ? 'You' : matchName || 'Match'}
            </Text>
            <Text style={styles.messageText}>{item.body}</Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
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
    height: 4,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.md,
    marginBottom: ui.spacing.sm
  },
  empty: {
    color: ui.color.textSecondary,
    marginTop: ui.spacing.lg,
    fontSize: ui.type.body
  },
  headerTitle: {
    color: ui.color.accent,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: ui.spacing.md
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  headerAvatarFallback: {
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerAvatarInitial: {
    color: ui.color.accent,
    fontSize: 13,
    fontWeight: '800'
  },
  listContent: {
    paddingBottom: ui.spacing.sm,
    gap: 8
  },
  messageBubble: {
    backgroundColor: ui.color.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ui.color.border,
    marginBottom: ui.spacing.xs,
    ...ui.shadow.soft
  },
  messageText: {
    color: ui.color.textPrimary,
    fontSize: 15,
    lineHeight: 20
  },
  senderName: {
    color: ui.color.accent,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  time: {
    fontSize: 11,
    color: ui.color.textMuted,
    marginTop: 4
  },
  input: {
    height: ui.field.height,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.xl,
    paddingHorizontal: ui.field.paddingX,
    marginTop: ui.spacing.sm,
    marginBottom: ui.spacing.xs,
    backgroundColor: ui.color.card,
    color: ui.color.textPrimary,
    fontSize: 15,
    ...ui.shadow.soft
  }
});
