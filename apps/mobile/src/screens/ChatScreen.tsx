import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { io, Socket } from 'socket.io-client';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { API_ORIGIN } from '../config/network';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface ChatMessage {
  _id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export function ChatScreen({ route }: Props) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  const socket = useMemo(() => {
    if (!accessToken) return null;
    return io(API_ORIGIN, {
      transports: ['websocket'],
      auth: { token: accessToken }
    });
  }, [accessToken]);

  useEffect(() => {
    if (!socket || !accessToken) return;

    socket.emit('chat:join', { matchId: route.params.matchId });
    socket.on('chat:new', (message: ChatMessage) => {
      setMessages((prev) => [message, ...prev]);
    });

    void apiRequest<{ items: ChatMessage[] }>(
      `/matches/${route.params.matchId}/messages`,
      undefined,
      accessToken
    ).then((res) => setMessages(res.items));

    return () => {
      socket.disconnect();
    };
  }, [socket, route.params.matchId, accessToken]);

  const send = () => {
    if (!socket || !text.trim()) return;
    socket.emit('chat:send', { matchId: route.params.matchId, text });
    setText('');
  };

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
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Send a message"
      />
      <PrimaryButton label="Send" onPress={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EE', padding: 12 },
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
