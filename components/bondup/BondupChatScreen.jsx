/**
 * BondupChatScreen.jsx
 *
 * Chat UI for Bondup participants.
 * Supports both group (bondup_group) and 1-on-1 (bondup_single) chats.
 *
 * For bondup_single chats, implements a 3-state match flow:
 *   PRE_MATCH     → Each user can send MESSAGE_LIMIT messages
 *   MATCH_PENDING → One user requested a match; waiting for the other
 *   MATCHED       → Both agreed; unlimited messaging
 *
 * Used by app/(root)/bondup-chat/index.jsx
 */

import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Flame,
    Heart,
    Lock,
    Send,
    X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
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
const MATCH_GREEN = '#22C55E';

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

const getFirstName = (user) => user?.firstName || 'User';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export default function BondupChatScreen({ chatId, bondupId, bondupTitle, participantCount }) {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // ── Chat state (match flow) ──────────────────────────────────────────────
  const [chatState, setChatState] = useState({
    type: 'bondup_group',
    matchStatus: 'none',
    matchInitiatedBy: null,
    messageLimit: 3,
    messagesSent: 0,
    messagesRemaining: 3,
    isLimitReached: false,
  });
  const [chatMembers, setChatMembers] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const isSingle = chatState.type === 'bondup_single';
  const isMatched = chatState.matchStatus === 'matched';
  const isPending = chatState.matchStatus === 'pending';
  const isPreMatch = chatState.matchStatus === 'none';
  const iInitiatedMatch = String(chatState.matchInitiatedBy?._id || chatState.matchInitiatedBy) === String(currentUser?._id);
  const canSendMessage = !isSingle || isMatched || !chatState.isLimitReached;

  // The other member in bondup_single chat
  const otherMember = chatMembers.find((m) => String(m._id) !== String(currentUser?._id));

  // ── Load chat details + state on mount ────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const [detailRes, stateRes] = await Promise.all([
          bondupChatService.getChatDetails(chatId),
          bondupChatService.getChatState(chatId),
        ]);
        if (detailRes?.data?.members) {
          setChatMembers(detailRes.data.members);
        }
        if (detailRes?.data?.type) {
          setChatState((prev) => ({ ...prev, type: detailRes.data.type }));
        }
        if (stateRes?.data) {
          setChatState((prev) => ({ ...prev, ...stateRes.data }));
        }
      } catch {
        // silent
      }
    })();
  }, [chatId]);

  // ── Load messages on mount ────────────────────────────────────────────────
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

  // ── Socket: join room + real-time messages ─────────────────────────────────
  useEffect(() => {
    if (!chatId) return;

    // Join the bondup chat room
    socketService.emit('bondupChat:join', { chatId });

    const handleMessage = (msg) => {
      if (msg.chatId === chatId || msg.bondupChatId === chatId || msg.bondupChat === chatId) {
        setMessages((prev) => {
          // Deduplicate
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100);
      }
    };

    const handleMatchUpdate = (data) => {
      if (data.chatId === chatId) {
        setChatState((prev) => ({
          ...prev,
          matchStatus: data.matchStatus,
          matchInitiatedBy: data.matchInitiatedBy || prev.matchInitiatedBy,
        }));
      }
    };

    const handleLimitReached = (data) => {
      if (data.chatId === chatId) {
        setChatState((prev) => ({
          ...prev,
          isLimitReached: data.userId === String(currentUser?._id) ? true : prev.isLimitReached,
        }));
      }
    };

    socketService.on('bondup_chat:message', handleMessage);
    socketService.on(`bondupChat:${chatId}:message`, handleMessage);
    socketService.on(`bondupChat:${chatId}:matchUpdate`, handleMatchUpdate);
    socketService.on(`bondupChat:${chatId}:limitReached`, handleLimitReached);
    socketService.on('bondupChat:matched', handleMatchUpdate);
    socketService.on('bondupChat:matchRequested', handleMatchUpdate);

    return () => {
      socketService.emit('bondupChat:leave', { chatId });
      socketService.off('bondup_chat:message', handleMessage);
      socketService.off(`bondupChat:${chatId}:message`, handleMessage);
      socketService.off(`bondupChat:${chatId}:matchUpdate`, handleMatchUpdate);
      socketService.off(`bondupChat:${chatId}:limitReached`, handleLimitReached);
      socketService.off('bondupChat:matched', handleMatchUpdate);
      socketService.off('bondupChat:matchRequested', handleMatchUpdate);
    };
  }, [chatId, currentUser?._id]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || sending) return;

    if (!canSendMessage) {
      Alert.alert(
        'Message Limit Reached',
        'You\'ve used all your messages. Request a match to continue chatting!'
      );
      return;
    }

    setInputText('');
    setSending(true);

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
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        Alert.alert('Error', 'Message could not be sent. Please try again.');
      }

      // Update remaining messages from response meta
      if (res.meta) {
        setChatState((prev) => ({
          ...prev,
          messagesRemaining: res.meta.messagesRemaining ?? prev.messagesRemaining,
          messagesSent: (prev.messagesSent || 0) + 1,
          isLimitReached: (res.meta.messagesRemaining ?? 1) <= 0,
          matchStatus: res.meta.matchStatus || prev.matchStatus,
        }));
      }
    } catch (err) {
      const errData = err?.response?.data;
      if (errData?.code === 'MESSAGE_LIMIT_REACHED') {
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        setChatState((prev) => ({ ...prev, isLimitReached: true }));
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        Alert.alert('Error', 'Failed to send message. Check your connection.');
      }
    } finally {
      setSending(false);
    }
  };

  // ── Match actions ──────────────────────────────────────────────────────────
  const handleRequestMatch = async () => {
    setMatchLoading(true);
    try {
      const res = await bondupChatService.requestMatch(chatId);
      if (res?.data) {
        setChatState((prev) => ({
          ...prev,
          matchStatus: res.data.matchStatus,
          matchInitiatedBy: res.data.matchInitiatedBy || currentUser?._id,
        }));
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not send match request.');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleDeclineMatch = async () => {
    setMatchLoading(true);
    try {
      const res = await bondupChatService.declineMatch(chatId);
      if (res?.data) {
        setChatState((prev) => ({
          ...prev,
          matchStatus: res.data.matchStatus,
          matchInitiatedBy: null,
        }));
      }
    } catch {
      Alert.alert('Error', 'Could not decline match.');
    } finally {
      setMatchLoading(false);
    }
  };

  // ── Navigate to user profile ───────────────────────────────────────────────
  const handlePressUser = (user) => {
    if (!user?._id) return;
    router.push({
      pathname: `/bondup-profile/${user._id}`,
      params: { chatId },
    });
  };

  // ── Render message ─────────────────────────────────────────────────────────
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
          <TouchableOpacity onPress={() => handlePressUser(sender)} activeOpacity={0.7}>
            {senderAv ? (
              <Image source={{ uri: senderAv }} style={ms.senderAvatar} />
            ) : (
              <View style={[ms.senderAvatar, ms.senderAvatarFallback]}>
                <Text style={ms.senderAvatarInitial}>
                  {(sender?.firstName || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={ms.avatarSpacer} />
        )}
        <View style={ms.bubbleOtherWrap}>
          {showAvatar && (
            <TouchableOpacity onPress={() => handlePressUser(sender)} activeOpacity={0.7}>
              <Text style={ms.senderName}>{getFullName(sender)}</Text>
            </TouchableOpacity>
          )}
          <View style={ms.bubbleOther}>
            <Text style={ms.bubbleOtherText}>{item.content}</Text>
            <Text style={[ms.timeText, ms.timeTextOther]}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Match banner (bondup_single only) ──────────────────────────────────────
  const renderMatchBanner = () => {
    if (!isSingle) return null;

    // MATCHED state
    if (isMatched) {
      return (
        <View style={[bs.banner, bs.bannerMatched]}>
          <Heart size={16} color={MATCH_GREEN} fill={MATCH_GREEN} />
          <Text style={bs.bannerMatchedText}>
            You're matched! Chat freely.
          </Text>
        </View>
      );
    }

    // PENDING state
    if (isPending) {
      if (iInitiatedMatch) {
        // I sent the request
        return (
          <View style={[bs.banner, bs.bannerPending]}>
            <Heart size={16} color={BRAND} />
            <Text style={bs.bannerPendingText}>
              Match request sent! Waiting for {getFirstName(otherMember)}...
            </Text>
          </View>
        );
      }

      // The other person sent a request to me
      return (
        <View style={bs.matchRequestCard}>
          <View style={bs.matchRequestHeader}>
            <Heart size={18} color={BRAND} fill={BRAND} />
            <Text style={bs.matchRequestTitle}>
              {getFirstName(otherMember)} wants to match!
            </Text>
          </View>
          <Text style={bs.matchRequestSub}>
            Accept to unlock unlimited messaging
          </Text>
          <View style={bs.matchRequestActions}>
            <TouchableOpacity
              style={bs.matchDeclineBtn}
              onPress={handleDeclineMatch}
              disabled={matchLoading}
              activeOpacity={0.8}
            >
              <X size={16} color="#666" />
              <Text style={bs.matchDeclineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={bs.matchAcceptBtn}
              onPress={handleRequestMatch}
              disabled={matchLoading}
              activeOpacity={0.8}
            >
              <Heart size={16} color="#fff" />
              <Text style={bs.matchAcceptText}>Accept Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // PRE_MATCH state — show message counter
    if (isPreMatch && chatState.messagesRemaining != null) {
      if (chatState.isLimitReached) {
        return (
          <View style={bs.limitReachedCard}>
            <Lock size={18} color={BRAND} />
            <Text style={bs.limitReachedTitle}>Message limit reached</Text>
            <Text style={bs.limitReachedSub}>
              Request a match to continue chatting with {getFirstName(otherMember)}
            </Text>
            <TouchableOpacity
              style={bs.matchRequestBtn}
              onPress={handleRequestMatch}
              disabled={matchLoading}
              activeOpacity={0.85}
            >
              <Heart size={16} color="#fff" />
              <Text style={bs.matchRequestBtnText}>Request Match</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={[bs.banner, bs.bannerCounter]}>
          <Text style={bs.counterText}>
            {chatState.messagesRemaining} message{chatState.messagesRemaining !== 1 ? 's' : ''} remaining
          </Text>
          <Text style={bs.counterSubText}>• Match to chat freely</Text>
        </View>
      );
    }

    return null;
  };

  // ── Header for bondup_single ───────────────────────────────────────────────
  const headerTitle = isSingle && otherMember
    ? getFirstName(otherMember)
    : bondupTitle || 'Bondup Chat';

  const headerSub = isSingle
    ? (isMatched ? 'Matched' : 'Bondup Chat')
    : `${participantCount || chatMembers.length || 0} members`;

  return (
    <SafeAreaView style={cs.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={cs.header}>
        <TouchableOpacity onPress={() => router.back()} style={cs.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color="#333" />
        </TouchableOpacity>

        {isSingle && otherMember ? (
          <TouchableOpacity
            style={cs.headerCenter}
            onPress={() => handlePressUser(otherMember)}
            activeOpacity={0.7}
          >
            {avatarUrl(otherMember) ? (
              <Image source={{ uri: avatarUrl(otherMember) }} style={cs.headerAvatar} />
            ) : (
              <View style={[cs.headerAvatar, cs.headerAvatarFallback]}>
                <Text style={cs.headerAvatarInitial}>
                  {(otherMember?.firstName || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={cs.headerTitle} numberOfLines={1}>{headerTitle}</Text>
              <Text style={cs.headerSub}>{headerSub}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={cs.headerCenterGroup}>
            <Text style={cs.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            <Text style={cs.headerSub}>{headerSub}</Text>
          </View>
        )}

        <View style={cs.headerIcon}>
          {isMatched ? (
            <Heart size={18} color={MATCH_GREEN} fill={MATCH_GREEN} />
          ) : (
            <Flame size={20} color={BRAND} />
          )}
        </View>
      </View>

      {/* Match Banner */}
      {renderMatchBanner()}

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
              <Text style={cs.emptyChatText}>
                {isSingle
                  ? `Say hello to ${getFirstName(otherMember)}!`
                  : 'No messages yet. Say hello!'}
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={cs.inputBar}>
          {canSendMessage ? (
            <>
              <TextInput
                style={cs.input}
                placeholder={
                  isSingle && !isMatched
                    ? `Message (${chatState.messagesRemaining ?? '?'} left)...`
                    : 'Say something...'
                }
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
            </>
          ) : (
            <TouchableOpacity
              style={cs.matchPromptBtn}
              onPress={handleRequestMatch}
              disabled={matchLoading || isPending}
              activeOpacity={0.85}
            >
              <Heart size={18} color="#fff" />
              <Text style={cs.matchPromptText}>
                {isPending
                  ? (iInitiatedMatch ? 'Waiting for response...' : 'Accept Match')
                  : 'Request Match to Continue'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Container + Header Styles ──────────────────────────────────────────────
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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    gap: 10,
  },
  headerCenterGroup: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarFallback: {
    backgroundColor: BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
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
  matchPromptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 20,
    paddingVertical: 14,
  },
  matchPromptText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
});

// ─── Banner Styles ──────────────────────────────────────────────────────────
const bs = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bannerMatched: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  bannerMatchedText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: MATCH_GREEN,
  },
  bannerPending: {
    backgroundColor: `${BRAND}10`,
    borderBottomColor: `${BRAND}20`,
  },
  bannerPendingText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
    color: BRAND,
    flex: 1,
  },
  bannerCounter: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  counterText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
    color: '#92400E',
  },
  counterSubText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    color: '#B45309',
  },

  // Match request card (received)
  matchRequestCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: `${BRAND}08`,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${BRAND}25`,
  },
  matchRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  matchRequestTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#111',
  },
  matchRequestSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
    marginBottom: 14,
    marginLeft: 26,
  },
  matchRequestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  matchDeclineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  matchDeclineText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#666',
  },
  matchAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchAcceptText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },

  // Limit reached card
  limitReachedCard: {
    margin: 16,
    marginBottom: 8,
    padding: 18,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  limitReachedTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#92400E',
    marginTop: 8,
    marginBottom: 4,
  },
  limitReachedSub: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 14,
  },
  matchRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchRequestBtnText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
});

// ─── Message Bubble Styles ──────────────────────────────────────────────────
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
