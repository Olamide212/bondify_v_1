/**
 * BondupChatScreen.jsx
 *
 * Group chat UI for Bondup participants.
 * Used by app/(root)/bondup-chat/index.jsx
 */

import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Flame,
  Send,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors } from '../../constant/colors';
import bondupChatService from '../../services/bondupChatService';
import { socketService } from '../../services/socketService';

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export default function BondupChatScreen({ chatId, bondupTitle, participantCount }) {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Load messages on mount
  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const res = await bondupChatService.getMessages(chatId);
        const msgs = res.data ?? res.messages ?? [];
        setMessages(Array.isArray(msgs) ? msgs.reverse() : []);
      } catch {
        // silent fail
      }
    })();
  }, [chatId]);

  // Socket: real-time messages
  useEffect(() => {
    if (!chatId) return;
    const handleMessage = (msg) => {
      if (msg.chatId === chatId || msg.bondupChatId === chatId) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100);
      }
    };
    socketService.on('bondup_chat:message', handleMessage);
    return () => socketService.off('bondup_chat:message', handleMessage);
  }, [chatId]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      content,
      sender: currentUser,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100);

    try {
      const res = await bondupChatService.sendMessage(chatId, { content });
      const sentMsg = res.data ?? res.message ?? null;
      if (sentMsg?._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMsg._id ? { ...sentMsg, isTemp: false } : m))
        );
      } else {
        // Server didn't return a proper message — remove the temp optimistic entry
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const sender = item.sender;
    const isMe = String(sender?._id || sender) === String(currentUser?._id);
    const senderAv = avatarUrl(sender);
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showAvatar =
      !isMe &&
      (!prevMsg || String(prevMsg.sender?._id || prevMsg.sender) !== String(sender?._id || sender));

    if (isMe) {
      return (
        <View style={[ms.row, ms.rowMe]}>
          <View style={[ms.bubble, ms.bubbleMe, item.isTemp && { opacity: 0.7 }]}>
            <Text style={ms.bubbleMeText}>{item.content}</Text>
            <Text style={ms.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[ms.row, ms.rowOther]}>
        {showAvatar ? (
          senderAv ? (
            <Image source={{ uri: senderAv }} style={ms.senderAvatar} />
          ) : (
            <View style={[ms.senderAvatar, ms.senderAvatarFallback]}>
              <Text style={ms.senderAvatarInitial}>
                {(sender?.firstName || '?')[0].toUpperCase()}
              </Text>
            </View>
          )
        ) : (
          <View style={ms.avatarSpacer} />
        )}
        <View style={ms.bubbleOtherWrap}>
          {showAvatar && (
            <Text style={ms.senderName}>{getFullName(sender)}</Text>
          )}
          <View style={ms.bubbleOther}>
            <Text style={ms.bubbleOtherText}>{item.content}</Text>
            <Text style={[ms.timeText, ms.timeTextOther]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={cs.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={cs.header}>
        <TouchableOpacity onPress={() => router.back()} style={cs.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>
        <View style={cs.headerCenter}>
          <Text style={cs.headerTitle} numberOfLines={1}>{bondupTitle || 'Bondup Chat'}</Text>
          <Text style={cs.headerSub}>{participantCount || 0} members</Text>
        </View>
        <View style={cs.headerIcon}>
          <Flame size={20} color={BRAND} />
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderMessage}
          contentContainerStyle={cs.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: false })}
          ListEmptyComponent={
            <View style={cs.emptyChat}>
              <Text style={cs.emptyChatEmoji}>👋</Text>
              <Text style={cs.emptyChatText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={cs.inputBar}>
          <TextInput
            style={cs.input}
            placeholder="Say something..."
            placeholderTextColor="#BBB"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[cs.sendBtn, (!inputText.trim() || sending) && cs.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cs = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
    marginTop: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyChatEmoji: { fontSize: 40, marginBottom: 12 },
  emptyChatText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#888',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});

const ms = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  senderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 2,
  },
  senderAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
  },
  avatarSpacer: {
    width: 38,
  },

  bubbleOtherWrap: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSansBold',
    color: '#888',
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: BRAND,
    borderBottomRightRadius: 4,
    maxWidth: '75%',
  },
  bubbleMeText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#fff',
  },
  bubbleOther: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOtherText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans',
    color: '#111',
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 3,
  },
  timeTextOther: {
    color: '#AAA',
  },
});
