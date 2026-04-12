

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  MoreVertical,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constant/colors";
import { images } from "../../../constant/images";
import { useAlert } from "../../../context/AlertContext";
import AIService from "../../../services/aiService";
import { profileService } from "../../../services/profileService";

const PRIMARY        = colors.primary;
const PRIMARY_LIGHT  = colors.primaryLight;
const PRIMARY_BORDER = colors.primaryBorder;

const BOT_AVATAR = images.BOT_AVARTAR;

// Keywords that trigger a profile search instead of a plain chat reply
const PROFILE_SEARCH_TRIGGERS = [
  'show me', 'find me', 'find people', 'search for', 'suggest profile',
  'suggest people', 'profiles near', 'near me', 'close to me', 'people who',
  'matches who', 'who like', 'looking for', 'interested in', 'who are',
];

// ─── Profile Card Strip ────────────────────────────────────────────────────────
const ProfileCardStrip = ({ profiles, onPress }) => {
  if (!profiles || profiles.length === 0) return null;

  return (
    <FlatList
      data={profiles}
      horizontal
      keyExtractor={(p) => p._id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pcs.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={pcs.card}
          onPress={() => onPress(item._id)}
          activeOpacity={0.88}
        >
          {/* Avatar */}
          <View style={pcs.imageWrap}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={pcs.image} />
            ) : (
              <View style={[pcs.image, pcs.imageFallback]}>
                <Text style={pcs.imageFallbackText}>
                  {(item.firstName || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Name + age */}
          <Text style={pcs.name} numberOfLines={1}>
            {item.firstName}{item.age ? `, ${item.age}` : ''}
          </Text>

          {/* Location */}
          {item.city ? (
            <Text style={pcs.city} numberOfLines={1}>📍 {item.city}</Text>
          ) : null}

          {/* Interest pills — top 2 */}
          {item.interests && item.interests.length > 0 && (
            <View style={pcs.pills}>
              {item.interests.slice(0, 2).map((int, i) => (
                <View key={i} style={pcs.pill}>
                  <Text style={pcs.pillText} numberOfLines={1}>{int}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Looking for */}
          {item.lookingFor ? (
            <Text style={pcs.lookingFor} numberOfLines={1}>
              {item.lookingFor}
            </Text>
          ) : null}
        </TouchableOpacity>
      )}
    />
  );
};

const pcs = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  card: {
    width: 140,
    backgroundColor: '#121212',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: { width: '100%', height: 140, backgroundColor: '#1E1E1E' },
  image:     { width: '100%', height: '100%', resizeMode: 'cover' },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  imageFallbackText: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSansBold',
    color: '#9CA3AF',
  },
  name: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: 13,
    color: '#E5E5E5',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  city: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    paddingHorizontal: 10,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 6,
    gap: 4,
  },
  pill: {
    backgroundColor: '#2A1F1A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    maxWidth: 110,
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans',
    color: PRIMARY,
  },
  lookingFor: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#9CA3AF',
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 10,
  },
});

const BOTTOM_CHIPS = [
  { id: "bio",   icon: "🪞", label: "Review my bio" },
  { id: "dates", icon: "❤️", label: "Date ideas"    },
  { id: "next",  icon: "💬", label: "Next move"     },
  { id: "tips",  icon: "✨", label: "Profile tips"  },
];

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const parseAIContent = (text) => {
  const segments = [];
  const parts = text.split(/("[\s\S]*?")/g);
  parts.forEach((part) => {
    if (!part.trim()) return;
    if (part.startsWith('"') && part.endsWith('"')) {
      segments.push({ type: "suggestion", content: part.slice(1, -1) });
      return;
    }
    const tipSplit = part.split(/(💡\s*Profile Tip:[\s\S]*?)(?=\n\n|$)/gi);
    tipSplit.forEach((chunk) => {
      if (!chunk.trim()) return;
      if (/^💡\s*Profile Tip:/i.test(chunk.trim())) {
        segments.push({ type: "tip", content: chunk.replace(/^💡\s*Profile Tip:\s*/i, "").trim() });
      } else {
        segments.push({ type: "text", content: chunk.trim() });
      }
    });
  });
  return segments;
};

const TypingDots = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 280, useNativeDriver: true }),
          Animated.delay(560),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={styles.typingRow}>
      <Image source={BOT_AVATAR} style={styles.avatarSm} />
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
};

const SuggestionCard = ({ content, onCopy }) => (
  <View style={styles.suggestionCard}>
    <View style={styles.suggestionHeader}>
      <Sparkles size={13} color={PRIMARY} />
      <Text style={styles.suggestionLabel}>TOP SUGGESTION</Text>
    </View>
    <Text style={styles.suggestionQuote}>{content}</Text>
    <Pressable style={styles.copyBtn} onPress={() => onCopy(content)}>
      <Text style={styles.copyBtnText}>Copy Icebreaker</Text>
    </Pressable>
  </View>
);

const TipCard = ({ content }) => (
  <View style={styles.tipCard}>
    <Text style={styles.tipLabel}>💡  Profile Tip:</Text>
    {!!content && <Text style={styles.tipContent}>{content}</Text>}
  </View>
);

const AIBubble = ({ message, onCopy, onRetry }) => {
  if (message.error) {
    return (
      <View style={styles.aiBubbleRow}>
        <Image source={BOT_AVATAR} style={styles.avatarSm} />
        <View style={styles.errorBubble}>
          <Text style={styles.errorText}>{message.content}</Text>
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <RefreshCw size={12} color={PRIMARY} />
            <Text style={styles.retryText}>Tap to retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const segments     = parseAIContent(message.content);
  const textSegs     = segments.filter((s) => s.type === "text");
  const suggSegs     = segments.filter((s) => s.type === "suggestion");
  const tipSegs      = segments.filter((s) => s.type === "tip");
  return (
    <View style={styles.aiBubbleRow}>
      <Image source={BOT_AVATAR} style={styles.avatarSm} />
      <View style={styles.aiBubbleWrapper}>
        {textSegs.length > 0 && (
          <View style={styles.aiBubble}>
            <Text style={styles.aiBubbleText}>{textSegs.map((s) => s.content).join("\n\n")}</Text>
            <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
          </View>
        )}
        {suggSegs.map((s, i) => <SuggestionCard key={i} content={s.content} onCopy={onCopy} />)}
        {tipSegs.map((s, i)  => <TipCard key={i} content={s.content} />)}
      </View>
    </View>
  );
};

const UserBubble = ({ message, userPhoto, userInitial }) => (
  <View style={styles.userBubbleRow}>
    <View style={styles.userBubble}>
      <Text style={styles.userBubbleText}>{message.content}</Text>
      <Text style={styles.timestampUser}>{formatTime(message.timestamp)}</Text>
    </View>
    {userPhoto ? (
      <Image source={{ uri: userPhoto }} style={styles.userAvatar} />
    ) : (
      <View style={styles.userAvatarPlaceholder}>
        <Text style={styles.userAvatarInitial}>{userInitial}</Text>
      </View>
    )}
  </View>
);

const CHAT_STORAGE_KEY = "@bondies/bon-bot-chat";

const INITIAL_MESSAGE = {
  id: 1,
  role: "assistant",
  content: "Hi! I'm your Bondies Assistant. Ready to level up your dating game? I can help you with icebreakers, profile tips, or even planning a date! \ud83e\udde1\n\nYou can also ask me things like \"Show me profiles near me\" or \"Find people who love music\" and I'll suggest real matches! \ud83d\udd0d",
  timestamp: new Date(),
};

const AIChatScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // User photo state - fetched from API
  const [userPhoto, setUserPhoto] = useState(null);
  const [userInitial, setUserInitial] = useState("U");
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef             = useRef(null);

  const chatStorageKey = useMemo(() => {
    return userId ? `@bondify/cache/ai_chat_history-${userId}` : '@bondify/cache/ai_chat_history';
  }, [userId]);

  // Load chat from storage on mount
  useEffect(() => {
    const loadChat = async () => {
      try {
        const stored = await AsyncStorage.getItem(chatStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Restore timestamps as Date objects
          const restored = parsed.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          if (restored.length > 0) {
            setMessages(restored);
          }
        }
      } catch (err) {
        console.log("Failed to load chat history:", err);
      } finally {
        setChatLoaded(true);
      }
    };
    if (userId) loadChat(); // Only load when userId is available
  }, [userId, chatStorageKey]);

  // Save chat to storage whenever messages change
  useEffect(() => {
    if (!chatLoaded || !userId) return; // Don't save until initial load is complete and userId is set
    const saveChat = async () => {
      try {
        // Only save messages without profiles to keep storage small
        const toSave = messages.map(({ profiles, ...msg }) => msg);
        await AsyncStorage.setItem(chatStorageKey, JSON.stringify(toSave));
      } catch (err) {
        console.log("Failed to save chat history:", err);
      }
    };
    saveChat();
  }, [messages, chatLoaded, userId, chatStorageKey]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
          const profile = await profileService.getMyProfile({ force: true });
        const firstImage = Array.isArray(profile?.images) && profile.images.length > 0
          ? profile.images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]
          : null;
        const photo = profile?.profilePhoto || firstImage?.url || firstImage || null;
        const initial = (profile?.firstName || profile?.userName || "U")[0].toUpperCase();
        const id = profile?._id || profile?.id;
        setUserPhoto(photo);
        setUserInitial(initial);
        setUserId(id);
        setUserProfile(profile);
      } catch (err) {
        console.log("Failed to fetch user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  // Detect if a query is asking for profile suggestions
  const isProfileSearchQuery = useCallback((text) => {
    const lower = text.toLowerCase();
    return PROFILE_SEARCH_TRIGGERS.some((kw) => lower.includes(kw));
  }, []);

  const navigateToProfile = useCallback((userId) => {
    router.push({
      pathname: `/user-profile/${userId}`,
      params: { showActions: "true" },
    });
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  const buildHistory = useCallback(
    (msgs) => msgs.slice(1).filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
    []
  );

  const copyToClipboard = useCallback((text) => {
    Clipboard.setString(text);
    if (Platform.OS === "android") ToastAndroid.show("Copied!", ToastAndroid.SHORT);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (typeof text === "string" ? text : userInput).trim();
      if (!trimmed || isLoading) return;
      setUserInput("");
      const userMsg = { id: Date.now(), role: "user", content: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      try {
        // ── Profile search branch ────────────────────────────────────────
        if (isProfileSearchQuery(trimmed)) {
          const response = await AIService.searchProfiles(trimmed);
          const botText  = response?.data?.message ?? "Here's what I found! 👇";
          const profiles = response?.data?.profiles ?? [];
          setMessages((prev) => [
            ...prev,
            {
              id:        Date.now() + 1,
              role:      "assistant",
              content:   botText,
              timestamp: new Date(),
              // Attach profiles so the renderer can show cards
              profiles,
            },
          ]);
        } else {
          // ── Normal chat branch ─────────────────────────────────────────
          let messageContent = trimmed;
          // Include profile context based on the message content
          if (trimmed.toLowerCase().includes('bio') || trimmed.toLowerCase().includes('review my bio')) {
            const bio = userProfile?.bio || userProfile?.socialProfile?.bio || '';
            if (bio) {
              messageContent += `\n\nMy current bio: "${bio}"`;
            }
          } else if (trimmed.toLowerCase().includes('age') || trimmed.toLowerCase().includes('profile')) {
            const age = userProfile?.age;
            const interests = userProfile?.interests;
            const lookingFor = userProfile?.lookingFor;
            if (age) messageContent += `\n\nMy age: ${age}`;
            if (interests && interests.length > 0) messageContent += `\n\nMy interests: ${interests.join(', ')}`;
            if (lookingFor) messageContent += `\n\nI'm looking for: ${lookingFor}`;
          }
          const userMsgWithContext = { ...userMsg, content: messageContent };
          const history  = buildHistory([...messages, userMsgWithContext]);
          const response = await AIService.chat(history);
          const reply    = response?.message ?? response?.data?.message ?? "Sorry, I didn't catch that.";
          setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: reply, timestamp: new Date() }]);
        }
      } catch (err) {
        const errText = err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", content: errText, timestamp: new Date(), error: true }]);
      } finally {
        setIsLoading(false);
      }
    },
    [userInput, isLoading, messages, buildHistory, isProfileSearchQuery]
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.filter((m) => !m.error));
    sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const clearChat = async () => {
    showAlert({
      icon: "warning",
      title: "Clear chat",
      message: "Start a fresh conversation?",
      actions: [
        { label: "Cancel", style: "cancel" },
        { label: "Clear", style: "destructive", onPress: async () => {
            const newMessage = { id: Date.now(), role: "assistant", content: "Chat cleared! What would you like to work on? \ud83d\ude0a", timestamp: new Date() };
            setMessages([newMessage]);
            try {
              await AsyncStorage.removeItem(chatStorageKey);
            } catch (err) {
              console.log("Failed to clear chat storage:", err);
            }
          }
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Image source={BOT_AVATAR} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Bondies AI</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineLabel}>ONLINE ASSISTANT</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/ai-settings")} hitSlop={8}>
          <MoreVertical size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) =>
          msg.role === "user"
            ? <UserBubble key={msg.id} message={msg} userPhoto={userPhoto} userInitial={userInitial} />
            : (
              <View key={msg.id}>
                <AIBubble message={msg} onCopy={copyToClipboard} onRetry={retryLast} />
                {msg.profiles && msg.profiles.length > 0 && (
                  <ProfileCardStrip
                    profiles={msg.profiles}
                    onPress={navigateToProfile}
                  />
                )}
                {msg.profiles && msg.profiles.length === 0 && (
                  <View style={styles.noProfilesWrap}>
                    <Text style={styles.noProfilesText}>
                      🔍 No profiles matched that search. Try adjusting your filters!
                    </Text>
                  </View>
                )}
              </View>
            )
        )}
        {isLoading && <TypingDots />}
      </ScrollView>

      {/* ── Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {BOTTOM_CHIPS.map((chip) => (
          <Pressable key={chip.id} style={styles.chip} onPress={() => sendMessage(chip.label)}>
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <Sparkles size={16} color="#bbb" />
            <TextInput
              style={styles.textInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Ask BonBot anything..."
              placeholderTextColor="#bbb"
              multiline
              maxLength={500}
              editable={!isLoading}
              blurOnSubmit={false}
            />
            {/* <Pressable hitSlop={8}>
              <Paperclip size={18} color="#bbb" />
            </Pressable> */}
          </View>
          <Pressable
            style={[styles.sendBtn, (!userInput.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(userInput)}
            disabled={!userInput.trim() || isLoading}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  noProfilesWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#2A2218',
    borderRadius: 12,
    padding: 12,
  },
  noProfilesText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,  gap: 10 },
  backBtn:      { padding: 2 },
  backArrow:    { fontSize: 22, color: "#fff" },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: PRIMARY },
  headerInfo:   { flex: 1 },
  headerTitle:  { fontSize: 16, color: '#E5E5E5', fontFamily: "PlusJakartaSansBold" },
  onlineRow:    { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot:    { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  onlineLabel:  { fontSize: 10, fontWeight: "800", color: PRIMARY, letterSpacing: 0.7, fontFamily: "PlusJakartaSans" },

  messagesList:    { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  aiBubbleRow:     { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 8 },
  avatarSm:        { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: PRIMARY_BORDER, marginTop: 2 },
  aiBubbleWrapper: { flex: 1, gap: 8 },
  aiBubble:        { backgroundColor: colors.primaryLight, borderRadius: 18, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, alignSelf: "flex-start", maxWidth: "96%" },
  aiBubbleText:    { fontSize: 15, color: '#E5E5E5', lineHeight: 22, fontFamily: "PlusJakartaSans" },

  suggestionCard:   { borderWidth: 1.5, borderColor: PRIMARY_BORDER, borderRadius: 16, padding: 14, backgroundColor: "#121212", gap: 10, maxWidth: "96%" },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  suggestionLabel:  { fontSize: 11, fontWeight: "800", color: PRIMARY, letterSpacing: 0.8, fontFamily: "PlusJakartaSans" },
  suggestionQuote:  { fontSize: 15, color: '#E5E5E5', lineHeight: 22, fontFamily: "PlusJakartaSans" },
  copyBtn:          { borderWidth: 1.5, borderColor: PRIMARY_BORDER, borderRadius: 22, paddingVertical: 9, alignItems: "center", backgroundColor: "#121212" },
  copyBtnText:      { fontSize: 14, color: PRIMARY, fontWeight: "600", fontFamily: "PlusJakartaSans" },

  tipCard:    { backgroundColor: PRIMARY_LIGHT, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 4, maxWidth: "96%" },
  tipLabel:   { fontSize: 13, fontWeight: "700", color: PRIMARY, fontFamily: "PlusJakartaSans" },
  tipContent: { fontSize: 14, color: '#D1D5DB', lineHeight: 20, fontFamily: "PlusJakartaSans" },

  userBubbleRow:         { flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end", marginBottom: 16, gap: 8 },
  userBubble:            { backgroundColor: PRIMARY, borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, maxWidth: "72%" },
  userBubbleText:        { fontSize: 15, color: "#fff", lineHeight: 22, fontFamily: "PlusJakartaSans" },
  userAvatar:            { width: 36, height: 36, borderRadius: 18 },
  userAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" },
  userAvatarInitial:     { fontSize: 14, fontWeight: "700", color: "#888" },

  timestamp:     { fontSize: 11, color: "#aaa", marginTop: 4, alignSelf: "flex-end", fontFamily: "PlusJakartaSans" },
  timestampUser: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4, alignSelf: "flex-end", fontFamily: "PlusJakartaSans" },

  errorBubble: { backgroundColor: '#2A1A1A', borderWidth: 1, borderColor: "#fecaca", borderRadius: 14, padding: 12, maxWidth: "96%", gap: 6 },
  errorText:   { fontSize: 14, color: "#ef4444", fontFamily: "PlusJakartaSans" },
  retryBtn:    { flexDirection: "row", alignItems: "center", gap: 5 },
  retryText:   { fontSize: 12, color: PRIMARY, fontFamily: "PlusJakartaSans" },

  typingRow:    { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 16 },
  typingBubble: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 18, borderTopLeftRadius: 4, paddingHorizontal: 18, paddingVertical: 16, gap: 5 },
  dot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: "#c5c5c5" },

  // ── Chips — reduced height ───────────────────────────────────
  chipsScroll: { borderTopWidth: 1, borderTopColor: colors.whiteLight, backgroundColor: "#121212", flexGrow: 0 },
  chipsRow:    { paddingHorizontal: 12, paddingVertical: 5, paddingTop: 20, gap: 8, flexDirection: "row", alignItems: "center" },
  chip:        { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: colors.whiteLight, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#121212" },
  chipIcon:    { fontSize: 13 },
  chipLabel:   { fontSize: 12, color: '#D1D5DB', fontFamily: "PlusJakartaSans" },

  inputBar:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20, backgroundColor: "#121212", gap: 10 },
  inputWrapper:   { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.whiteLight, borderRadius: 28, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 6, backgroundColor: "#121212", gap: 8 },
  textInput:      { flex: 1, fontSize: 15, color: '#fff', maxHeight: 100, fontFamily: "PlusJakartaSans", paddingTop: 0, paddingBottom: 0 },
  sendBtn:        { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled:{ backgroundColor: PRIMARY + "30" },
});

export default AIChatScreen;