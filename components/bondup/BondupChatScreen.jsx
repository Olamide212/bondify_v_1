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

import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    Flame,
    LogOut,
    MapPin,
    Send,
    Users,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors } from '../../constant/colors';
import bondupChatService from '../../services/bondupChatService';
import bondupService from '../../services/bondupService';
import settingsService from '../../services/settingsService';
import { socketService } from '../../services/socketService';
import cacheManager from '../../utils/cacheManager';
import ChatBackground from '../common/ChatBackground';
import BondupDetailModal from './BondupDetailModal';

const BRAND = colors.primary;

const ACTIVITY_EMOJI = {
  coffee: '☕', food: '🍔', drinks: '🍹', brunch: '🥐', dinner: '🍽️', lunch: '🥗', snacks: '🍿', dessert: '🍰',
  gym: '💪', yoga: '🧘', running: '🏃', hiking: '🥾', cycling: '🚴', swimming: '🏊', tennis: '🎾', basketball: '🏀', football: '⚽', volleyball: '🏐',
  walk: '🚶', park: '🌳', beach: '🏖️', picnic: '🧺', camping: '⛺', fishing: '🎣',
  movie: '🎬', theater: '🎭', concert: '🎵', museum: '🏛️', art: '🎨', comedy: '😂',
  board_games: '🎲', video_games: '🎮', karaoke: '🎤', dancing: '💃', party: '🎉', networking: '🤝',
  workshop: '🔨', class: '📚', photography: '📷', painting: '🖌️', music: '🎼',
  other: '✨',
};
const ACTIVITY_LABEL = {
  coffee: 'Coffee', food: 'Dining', drinks: 'Drinks', brunch: 'Brunch', dinner: 'Dinner', lunch: 'Lunch', snacks: 'Snacks', dessert: 'Dessert',
  gym: 'Gym', yoga: 'Yoga', running: 'Running', hiking: 'Hiking', cycling: 'Cycling', swimming: 'Swimming', tennis: 'Tennis', basketball: 'Basketball', football: 'Football', volleyball: 'Volleyball',
  walk: 'Walking', park: 'Park', beach: 'Beach', picnic: 'Picnic', camping: 'Camping', fishing: 'Fishing',
  movie: 'Cinema', theater: 'Theater', concert: 'Concert', museum: 'Museum', art: 'Art Gallery', comedy: 'Comedy Show',
  board_games: 'Board Games', video_games: 'Video Games', karaoke: 'Karaoke', dancing: 'Dancing', party: 'Party', networking: 'Networking',
  workshop: 'Workshop', class: 'Class', photography: 'Photography', painting: 'Painting', music: 'Music',
  other: 'Other',
};

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const getFullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

const getFirstName = (user) => user?.firstName || 'User';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const formatBondupDate = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (dDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Tomorrow, ${timeStr}`;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
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

  // ── Bondup details + modals ──────────────────────────────────────────────
  const [bondupData, setBondupData] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [leaveReportVisible, setLeaveReportVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // Global action modal state (replaces native Alert)
  const [actionModal, setActionModal] = useState({ visible: false, icon: null, title: '', message: '', actions: [] });
  // Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const isSingle = chatState.type === 'bondup_single';
  const canSendMessage = true; // Bondup chats are unrestricted

  const playSound = async (soundFile) => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: 0.7,
      });
      // Auto cleanup after sound finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      if (__DEV__) console.warn('[BondupChatScreen] Sound playback failed:', error);
    }
  };

  // The other member in bondup_single chat
  const otherMember = chatMembers.find((m) => String(m._id) !== String(currentUser?._id));

  // Cache chat members to avoid repeated API calls
  useEffect(() => {
    if (!chatMembers || chatMembers.length === 0) return;
    chatMembers.forEach((member) => {
      if (member?._id) {
        const cacheKey = `bondup_user_${member._id}`;
        cacheManager.set("bondup_chat_profiles", cacheKey, member, 24 * 60 * 60 * 1000); // 24 hours TTL
      }
    });
  }, [chatMembers]);

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

  // ── Fetch bondup details for the info card ─────────────────────────────────
  useEffect(() => {
    if (!bondupId) return;
    (async () => {
      try {
        const res = await bondupService.getBondup(bondupId);
        if (res?.data) setBondupData(res.data);
        else if (res?.bondup) setBondupData(res.bondup);
      } catch {
        // silent — card just won't show
      }
    })();
  }, [bondupId]);

  // ── Load messages on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const res = await bondupChatService.getMessages(chatId);
        const msgs = res.data ?? res.messages ?? [];
        // Deduplicate by _id
        const raw = Array.isArray(msgs) ? msgs.reverse() : [];
        const seen = new Set();
        const unique = raw.filter((m) => {
          if (!m._id || seen.has(m._id)) return false;
          seen.add(m._id);
          return true;
        });
        setMessages(unique);
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
          // Deduplicate by _id and also check if it's replacing a temp message from current user
          const senderIdStr = String(msg.sender?._id || msg.sender);
          const currentUserIdStr = String(currentUser?._id);
          const isCurrentUserMsg = senderIdStr === currentUserIdStr;
          
          // Check if this message already exists
          if (prev.some((m) => m._id === msg._id)) return prev;
          
          // If this is from current user, remove any temp message we created
          if (isCurrentUserMsg) {
            // Play message delivered sound when current user's message is confirmed
            playSound(require('../../assets/sounds/message-ping.mp3'));
            return prev.filter((m) => !m.isTemp).concat([msg]);
          }
          
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

    if (!canSendMessage) return;

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
        // Play message sent sound
        // playSound(require('../../assets/sounds/message-sent.mp3'));
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
        showActionModal({
          icon: 'error',
          title: 'Error',
          message: 'Message could not be sent. Please try again.',
          actions: [{ label: 'OK', style: 'cancel', onPress: closeActionModal }],
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      showActionModal({
        icon: 'error',
        title: 'Error',
        message: 'Failed to send message. Check your connection.',
        actions: [{ label: 'OK', style: 'cancel', onPress: closeActionModal }],
      });
    } finally {
      setSending(false);
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

  // ── Show a global in-app action modal ────────────────────────────────────
  const showActionModal = ({ icon, title, message, actions }) => {
    setActionModal({ visible: true, icon: icon || null, title, message, actions: actions || [] });
  };
  const closeActionModal = () => setActionModal({ visible: false, icon: null, title: '', message: '', actions: [] });

  // ── Leave bondup ──────────────────────────────────────────────────────────
  const handleLeaveBondup = () => {
    setLeaveReportVisible(false);
    showActionModal({
      icon: 'leave',
      title: 'Leave Bondup?',
      message: 'You will exit this bondup and its chat. This action cannot be undone.',
      actions: [
        { label: 'Cancel', style: 'cancel', onPress: closeActionModal },
        {
          label: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await bondupService.leaveBondup(bondupId);
              closeActionModal();
              showActionModal({
                icon: 'success',
                title: 'Left Bondup',
                message: 'You have left this bondup.',
                actions: [{ label: 'OK', style: 'primary', onPress: () => { closeActionModal(); router.back(); } }],
              });
            } catch {
              closeActionModal();
              showActionModal({
                icon: 'error',
                title: 'Error',
                message: 'Could not leave bondup. Try again.',
                actions: [{ label: 'OK', style: 'cancel', onPress: closeActionModal }],
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    });
  };

  // ── Report bondup — open the report text modal ────────────────────────────
  const handleReportBondup = () => {
    setLeaveReportVisible(false);
    setReportText('');
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    const reason = reportText.trim();
    if (!reason) return;
    setReportLoading(true);
    try {
      const creatorId = bondupData?.createdBy?._id || bondupData?.createdBy;
      if (creatorId) {
        await settingsService.reportUser(creatorId, {
          reason,
          context: `Bondup: ${bondupTitle || bondupId}`,
        });
      }
      setReportModalVisible(false);
      showActionModal({
        icon: 'success',
        title: 'Reported',
        message: 'Thank you. We will review this shortly.',
        actions: [{ label: 'OK', style: 'primary', onPress: closeActionModal }],
      });
    } catch {
      setReportModalVisible(false);
      showActionModal({
        icon: 'error',
        title: 'Error',
        message: 'Could not submit report. Try again.',
        actions: [{ label: 'OK', style: 'cancel', onPress: closeActionModal }],
      });
    } finally {
      setReportLoading(false);
    }
  };

  // ── Bondup info card (top of chat) ─────────────────────────────────────────
  const renderBondupInfoCard = () => {
    const b = bondupData;
    if (!b) return null;
    const emoji = ACTIVITY_EMOJI[b.activityType] || '✨';
    const actLabel = ACTIVITY_LABEL[b.activityType] || b.activityType || 'Activity';
    const location = [b.location, b.city].filter(Boolean).join(', ');
    const dateLabel = formatBondupDate(b.dateTime);
    const pCount = b.participants?.length ?? participantCount ?? 0;

    return (
      <TouchableOpacity
        style={infoStyles.card}
        onPress={() => setDetailModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={infoStyles.cardInner}>
          <Text style={infoStyles.emoji}>{emoji}</Text>
          <View style={infoStyles.cardContent}>
            <Text style={infoStyles.title} numberOfLines={1}>
              {b.title || bondupTitle || 'Bondup'}
            </Text>
            <View style={infoStyles.metaRow}>
              {dateLabel ? (
                <View style={infoStyles.metaItem}>
                  <Clock size={11} color="#888" />
                  <Text style={infoStyles.metaText}>{dateLabel}</Text>
                </View>
              ) : null}
              {location ? (
                <View style={infoStyles.metaItem}>
                  <MapPin size={11} color="#888" />
                  <Text style={infoStyles.metaText} numberOfLines={1}>{location}</Text>
                </View>
              ) : null}
              <View style={infoStyles.metaItem}>
                <Users size={11} color="#888" />
                <Text style={infoStyles.metaText}>{pCount}</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={infoStyles.tapHint}>Tap for details</Text>
      </TouchableOpacity>
    );
  };

  // ── Leave / Report modal ──────────────────────────────────────────────────
  const renderLeaveReportModal = () => (
    <Modal
      visible={leaveReportVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setLeaveReportVisible(false)}
    >
      <TouchableOpacity
        style={lrStyles.overlay}
        activeOpacity={1}
        onPress={() => setLeaveReportVisible(false)}
      >
        <View style={lrStyles.sheet}>
          <View style={lrStyles.handle} />
          <Text style={lrStyles.sheetTitle}>Options</Text>

          <TouchableOpacity
            style={lrStyles.option}
            onPress={handleLeaveBondup}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            <View style={[lrStyles.optionIcon, { backgroundColor: '#2A1A1A' }]}>
              <LogOut size={18} color="#EF4444" />
            </View>
            <View style={lrStyles.optionTextWrap}>
              <Text style={lrStyles.optionLabel}>Leave Bondup</Text>
              <Text style={lrStyles.optionDesc}>Exit this bondup and its chat</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={lrStyles.option}
            onPress={handleReportBondup}
            activeOpacity={0.7}
          >
            <View style={[lrStyles.optionIcon, { backgroundColor: '#2A2218' }]}>
              <AlertTriangle size={18} color="#F59E0B" />
            </View>
            <View style={lrStyles.optionTextWrap}>
              <Text style={lrStyles.optionLabel}>Report</Text>
              <Text style={lrStyles.optionDesc}>Report inappropriate content</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={lrStyles.cancelBtn}
            onPress={() => setLeaveReportVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={lrStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Global action modal (replaces native Alert) ────────────────────────────
  const renderActionModal = () => (
    <Modal
      visible={actionModal.visible}
      transparent
      animationType="fade"
      onRequestClose={closeActionModal}
    >
      <View style={amStyles.overlay}>
        <View style={amStyles.card}>
          {actionModal.icon === 'success' && <Text style={amStyles.iconEmoji}>✅</Text>}
          {actionModal.icon === 'error' && <Text style={amStyles.iconEmoji}>❌</Text>}
          {actionModal.icon === 'leave' && <Text style={amStyles.iconEmoji}>🚪</Text>}
          <Text style={amStyles.title}>{actionModal.title}</Text>
          <Text style={amStyles.message}>{actionModal.message}</Text>
          <View style={amStyles.actions}>
            {actionModal.actions.map((action, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  amStyles.actionBtn,
                  action.style === 'destructive' && amStyles.actionBtnDestructive,
                  action.style === 'primary' && amStyles.actionBtnPrimary,
                  action.style === 'cancel' && amStyles.actionBtnCancel,
                ]}
                onPress={action.onPress}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    amStyles.actionBtnText,
                    action.style === 'destructive' && amStyles.actionBtnTextDestructive,
                    action.style === 'primary' && amStyles.actionBtnTextPrimary,
                    action.style === 'cancel' && amStyles.actionBtnTextCancel,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Report modal with text input ───────────────────────────────────────────
  const renderReportModal = () => (
    <Modal
      visible={reportModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setReportModalVisible(false)}
    >
      <View style={amStyles.overlay}>
        <View style={amStyles.card}>
          <Text style={amStyles.iconEmoji}>🚩</Text>
          <Text style={amStyles.title}>Report Bondup</Text>
          <Text style={amStyles.message}>Please describe the issue:</Text>
          <TextInput
            style={rpStyles.input}
            placeholder="What went wrong?"
            placeholderTextColor="#BBB"
            value={reportText}
            onChangeText={setReportText}
            multiline
            maxLength={500}
            autoFocus
          />
          <View style={amStyles.actions}>
            <TouchableOpacity
              style={amStyles.actionBtnCancel}
              onPress={() => setReportModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={amStyles.actionBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[amStyles.actionBtnDestructive, !reportText.trim() && { opacity: 0.4 }]}
              onPress={submitReport}
              disabled={!reportText.trim() || reportLoading}
              activeOpacity={0.8}
            >
              <Text style={amStyles.actionBtnTextDestructive}>
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Render message ─────────────────────────────────────────────────────────
  const renderMessage = ({ item, index }) => {
    const sender = item.sender;
    const isMe = String(sender?._id || sender) === String(currentUser?._id);
    const senderAv = avatarUrl(sender);
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const prevSenderId = prevMsg ? String(prevMsg.sender?._id || prevMsg.sender) : null;
    const currentSenderId = String(sender?._id || sender);
    const showAvatar =
      !isMe &&
      (!prevMsg || prevSenderId !== currentSenderId);
    // Always show sender name in group chats (for all messages from other users)
    const showSenderName = !isMe;

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
          {showSenderName && (
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

  // ── Header for bondup_single ───────────────────────────────────────────────
  const headerTitle = isSingle && otherMember
    ? getFirstName(otherMember)
    : bondupTitle || 'Bondup Chat';

  const headerSub = isSingle
    ? 'Bondup Chat'
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

        <TouchableOpacity
          style={cs.headerIcon}
          onPress={() => setLeaveReportVisible(true)}
          activeOpacity={0.7}
        >
          <Flame size={20} color={BRAND} />
        </TouchableOpacity>
      </View>

      {/* Bondup Info Card */}
      {renderBondupInfoCard()}



      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ChatBackground style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, i) => `${item._id || 'msg'}_${i}`}
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
        </ChatBackground>

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

      {/* Leave / Report Modal */}
      {renderLeaveReportModal()}

      {/* Global Action Modal */}
      {renderActionModal()}

      {/* Report Modal */}
      {renderReportModal()}

      {/* Bondup Detail Modal */}
      <BondupDetailModal
        visible={detailModalVisible}
        bondup={bondupData}
        currentUserId={currentUser?._id}
        onClose={() => setDetailModalVisible(false)}
        onJoin={() => {}}
        onLeave={handleLeaveBondup}
        onDelete={() => {}}
        onStartChat={() => setDetailModalVisible(false)}
        joinLoading={false}
      />
    </SafeAreaView>
  );
}

// ─── Container + Header Styles ──────────────────────────────────────────────
const cs = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#121212',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
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
    fontFamily: 'OutfitBold',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Outfit',
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
    fontFamily: 'Outfit',
    color: '#888',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#121212',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Outfit',
    color: '#E5E5E5',
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
    fontFamily: 'OutfitBold',
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
    borderBottomColor: '#333333',
  },
  bannerMatched: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  bannerMatchedText: {
    fontSize: 13,
    fontFamily: 'OutfitBold',
    color: colors.secondary,
  },
  bannerPending: {
    backgroundColor: `${BRAND}10`,
    borderBottomColor: `${BRAND}20`,
  },
  bannerPendingText: {
    fontSize: 13,
    fontFamily: 'OutfitMedium',
    color: BRAND,
    flex: 1,
  },
  bannerCounter: {
    backgroundColor: '#2A2518',
    borderBottomColor: '#FDE68A',
  },
  counterText: {
    fontSize: 13,
    fontFamily: 'OutfitBold',
    color: '#92400E',
  },
  counterSubText: {
    fontSize: 12,
    fontFamily: 'Outfit',
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
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  matchRequestSub: {
    fontSize: 13,
    fontFamily: 'Outfit',
    color: '#9CA3AF',
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
    backgroundColor: '#1E1E1E',
  },
  matchDeclineText: {
    fontSize: 14,
    fontFamily: 'OutfitBold',
    color: '#9CA3AF',
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
    fontFamily: 'OutfitBold',
    color: '#fff',
  },

  // Limit reached card
  limitReachedCard: {
    margin: 16,
    marginBottom: 8,
    padding: 18,
    backgroundColor: '#2A2518',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  limitReachedTitle: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#92400E',
    marginTop: 8,
    marginBottom: 4,
  },
  limitReachedSub: {
    fontSize: 13,
    fontFamily: 'Outfit',
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
    fontFamily: 'OutfitBold',
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
    fontFamily: 'OutfitBold',
  },
  avatarSpacer: {
    width: 38,
  },

  bubbleOtherWrap: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 11,
    fontFamily: 'OutfitBold',
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
    fontFamily: 'Outfit',
    color: '#fff',
  },
  bubbleOther: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOtherText: {
    fontSize: 15,
    fontFamily: 'Outfit',
    color: '#E5E5E5',
  },
  timeText: {
    fontSize: 10,
    fontFamily: 'Outfit',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    marginTop: 3,
  },
  timeTextOther: {
    color: '#AAA',
  },
});

// ─── Bondup Info Card Styles ────────────────────────────────────────────────
const infoStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: `${BRAND}08`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${BRAND}18`,
    padding: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Outfit',
    color: '#888',
  },
  tapHint: {
    fontSize: 10,
    fontFamily: 'Outfit',
    color: '#BBB',
    textAlign: 'right',
    marginTop: 6,
  },
});

// ─── Leave / Report Modal Styles ────────────────────────────────────────────
const lrStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    marginBottom: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Outfit',
    color: '#888',
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#9CA3AF',
  },
});

// ─── Global Action Modal Styles ─────────────────────────────────────────────
const amStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'OutfitBold',
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: BRAND,
  },
  actionBtnDestructive: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  actionBtnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
  },
  actionBtnTextPrimary: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  actionBtnTextDestructive: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  actionBtnTextCancel: {
    fontSize: 15,
    fontFamily: 'OutfitBold',
    color: '#9CA3AF',
  },
});

// ─── Report Input Styles ────────────────────────────────────────────────────
const rpStyles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Outfit',
    color: '#E5E5E5',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});
