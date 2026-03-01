import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { io } from 'socket.io-client';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { API_ORIGIN } from '../config/network';
import { MatchResponse } from '../types/api';

interface ChatMessage {
  _id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export function MessagesScreen() {
  const { accessToken } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    void apiRequest<MatchResponse | null>('/matches/current', undefined, accessToken).then((match) => {
      setMatchId(match?._id ?? null);
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
        <Text style={styles.empty}>No active match yet. Messages will appear once you are matched.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
          </View>
        )}
      />
      <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Send a message" />
      <PrimaryButton label="Send" onPress={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EE', padding: 12 },
  empty: { color: '#4A4A4A', marginTop: 20 },
  messageBubble: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8
  },
  time: { fontSize: 11, color: '#6A6A6A', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#FFFFFF'
  }
});
