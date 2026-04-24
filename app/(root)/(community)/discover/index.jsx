import {
    MoreVertical,
    Paperclip,
    RefreshCw,
    Send,
    Sparkles,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Clipboard,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../../constant/colors";
import { images } from "../../../../constant/images";
import { useAlert } from "../../../../context/AlertContext";
import AIService from "../../../../services/aiService";

// ─── Constants ────────────────────────────────────────────────
const PRIMARY       = colors.primary;
const PRIMARY_LIGHT = colors.primaryLight
const PRIMARY_BORDER = colors.primaryBorder

// Replace with your real bot avatar asset path
const BOT_AVATAR = images.BOT_AVARTAR;

const BOTTOM_CHIPS = [
  { id: "bio",   icon: "🪞", label: "Review my bio"  },
  { id: "dates", icon: "❤️", label: "Date ideas"     },
  { id: "next",  icon: "💬", label: "Next move"      },
  { id: "tips",  icon: "✨", label: "Profile tips"   },
];

// ─── Helpers ──────────────────────────────────────────────────
const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Splits AI reply into typed segments so we can render
 * suggestion cards and tip cards inside the bubble.
 *
 * Segments:
 *   { type: 'text',       content: string }
 *   { type: 'suggestion', content: string }  ← "quoted text"
 *   { type: 'tip',        content: string }  ← 💡 Profile Tip: ...
 */
const parseAIContent = (text) => {
  const segments = [];

  // Split on "quoted strings" — these become suggestion cards
  const parts = text.split(/("[\s\S]*?")/g);

  parts.forEach((part) => {
    if (!part.trim()) return;

    if (part.startsWith('"') && part.endsWith('"')) {
      segments.push({ type: "suggestion", content: part.slice(1, -1) });
      return;
    }

    // Split remaining text on Profile Tip lines
    const tipSplit = part.split(/(💡\s*Profile Tip:[\s\S]*?)(?=\n\n|$)/gi);
    tipSplit.forEach((chunk) => {
      if (!chunk.trim()) return;
      if (/^💡\s*Profile Tip:/i.test(chunk.trim())) {
        const tipContent = chunk.replace(/^💡\s*Profile Tip:\s*/i, "").trim();
        segments.push({ type: "tip", content: tipContent });
      } else {
        segments.push({ type: "text", content: chunk.trim() });
      }
    });
  });

  return segments;
};

// ─── Animated typing indicator ────────────────────────────────
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
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Suggestion Card ──────────────────────────────────────────
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

// ─── Profile Tip Card ─────────────────────────────────────────
const TipCard = ({ content }) => (
  <View style={styles.tipCard}>
    <Text style={styles.tipLabel}>💡  Profile Tip:</Text>
    {!!content && <Text style={styles.tipContent}>{content}</Text>}
  </View>
);

// ─── AI message bubble ────────────────────────────────────────
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

  const segments = parseAIContent(message.content);
  const textSegments       = segments.filter((s) => s.type === "text");
  const suggestionSegments = segments.filter((s) => s.type === "suggestion");
  const tipSegments        = segments.filter((s) => s.type === "tip");

  return (
    <View style={styles.aiBubbleRow}>
      <Image source={BOT_AVATAR} style={styles.avatarSm} />
      <View style={styles.aiBubbleWrapper}>

        {/* Plain text part */}
        {textSegments.length > 0 && (
          <View style={styles.aiBubble}>
            <Text style={styles.aiBubbleText}>
              {textSegments.map((s) => s.content).join("\n\n")}
            </Text>
            <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
          </View>
        )}

        {/* Suggestion cards */}
        {suggestionSegments.map((s, i) => (
          <SuggestionCard key={i} content={s.content} onCopy={onCopy} />
        ))}

        {/* Tip cards */}
        {tipSegments.map((s, i) => (
          <TipCard key={i} content={s.content} />
        ))}
      </View>
    </View>
  );
};

// ─── User message bubble ──────────────────────────────────────
const UserBubble = ({ message }) => (
  <View style={styles.userBubbleRow}>
    <View style={styles.userBubble}>
      <Text style={styles.userBubbleText}>{message.content}</Text>
      <Text style={styles.timestampUser}>{formatTime(message.timestamp)}</Text>
    </View>
    {/* Grey avatar placeholder — replace Image with user's actual photo */}
    <View style={styles.userAvatarPlaceholder}>
      <Text style={styles.userAvatarInitial}>Y</Text>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────
const AIChatScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm your Bondies Assistant. Ready to level up your dating game? I can help you with icebreakers, profile tips, or even planning a date! 🧡",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput]   = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const scrollViewRef               = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    const t = setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      80
    );
    return () => clearTimeout(t);
  }, [messages, isLoading]);

  // Build history array for the API
  const buildHistory = useCallback(
    (msgs) =>
      msgs
        .slice(1)                        // skip static welcome
        .filter((m) => !m.error)         // skip error bubbles
        .map((m) => ({ role: m.role, content: m.content })),
    []
  );

  const copyToClipboard = useCallback((text) => {
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    }
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (typeof text === "string" ? text : userInput).trim();
      if (!trimmed || isLoading) return;

      setUserInput("");

      const userMsg = {
        id: Date.now(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history  = buildHistory([...messages, userMsg]);
        const response = await AIService.chat(history);
        const reply    = response?.data?.message ?? "Sorry, I didn't catch that.";

        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content: reply, timestamp: new Date() },
        ]);
      } catch (err) {
        const errText =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again.";

        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content: errText, timestamp: new Date(), error: true },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [userInput, isLoading, messages, buildHistory]
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.filter((m) => !m.error));
    sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const clearChat = () => {
    showAlert({
      icon: 'delete',
      title: 'Clear chat',
      message: 'Start a fresh conversation?',
      actions: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Clear',
          style: 'destructive',
          onPress: () =>
            setMessages([
              {
                id: Date.now(),
                role: "assistant",
                content: "Chat cleared! What would you like to work on? 😊",
                timestamp: new Date(),
              },
            ]),
        },
      ],
    });
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <Image source={BOT_AVATAR} style={styles.headerAvatar} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>BonBot</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineLabel}>ONLINE ASSISTANT</Text>
          </View>
        </View>

        <Pressable onPress={clearChat} hitSlop={8}>
          <MoreVertical size={22} color="#444" />
        </Pressable>
      </View>

      {/* ── Messages ───────────────────────────────────────── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserBubble key={msg.id} message={msg} />
          ) : (
            <AIBubble
              key={msg.id}
              message={msg}
              onCopy={copyToClipboard}
              onRetry={retryLast}
            />
          )
        )}

        {isLoading && <TypingDots />}
      </ScrollView>

      {/* ── Bottom quick-action chips ───────────────────────── */}
      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {BOTTOM_CHIPS.map((chip) => (
          <Pressable
            key={chip.id}
            style={styles.chip}
            onPress={() => sendMessage(chip.label)}
          >
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </Pressable>
        ))}
      </ScrollView> */}

      {/* ── Input bar ──────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
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
            <Pressable hitSlop={8}>
              <Paperclip size={18} color="#bbb" />
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.sendBtn,
              (!userInput.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage(userInput)}
            disabled={!userInput.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    gap: 10,
  },
  backBtn: { padding: 2 },
  backArrow: { fontSize: 22, color: "#222", fontWeight: "500" },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: '#E5E5E5',
    fontFamily: "PlusJakartaSans",
  },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22c55e" },
  onlineLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: PRIMARY,
    letterSpacing: 0.7,
    fontFamily: "PlusJakartaSans",
  },

  // Messages list
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  // AI bubble
  aiBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 8,
  },
  avatarSm: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: PRIMARY_BORDER,
    marginTop: 2,
  },
  aiBubbleWrapper: { flex: 1, gap: 8 },
  aiBubble: {
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    alignSelf: "flex-start",
    maxWidth: "96%",
  },
  aiBubbleText: {
    fontSize: 15,
    color: '#E5E5E5',
    lineHeight: 22,
    fontFamily: "PlusJakartaSans",
  },

  // Suggestion card
  suggestionCard: {
    borderWidth: 1.5,
    borderColor: PRIMARY_BORDER,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#121212",
    gap: 10,
    maxWidth: "96%",
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: PRIMARY,
    letterSpacing: 0.8,
    fontFamily: "PlusJakartaSans",
  },
  suggestionQuote: {
    fontSize: 15,
    color: '#E5E5E5',
    lineHeight: 22,
    fontFamily: "PlusJakartaSans",
  },
  copyBtn: {
    borderWidth: 1.5,
    borderColor: PRIMARY_BORDER,
    borderRadius: 22,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#121212",
  },
  copyBtnText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
    fontFamily: "PlusJakartaSans",
  },

  // Tip card
  tipCard: {
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    maxWidth: "96%",
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
    fontFamily: "PlusJakartaSans",
  },
  tipContent: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    fontFamily: "PlusJakartaSans",
  },

  // User bubble
  userBubbleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 8,
  },
  userBubble: {
    backgroundColor: PRIMARY,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    maxWidth: "72%",
  },
  userBubbleText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
    fontFamily: "PlusJakartaSans",
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarInitial: { fontSize: 14, fontWeight: "700", color: "#888" },

  // Timestamps
  timestamp: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 4,
    alignSelf: "flex-end",
    fontFamily: "PlusJakartaSans",
  },
  timestampUser: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    alignSelf: "flex-end",
    fontFamily: "PlusJakartaSans",
  },

  // Error bubble
  errorBubble: {
    backgroundColor: '#2A1A1A',
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: 12,
    maxWidth: "96%",
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    fontFamily: "PlusJakartaSans",
  },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  retryText: {
    fontSize: 12,
    color: PRIMARY,
    fontFamily: "PlusJakartaSans",
  },

  // Typing indicator
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#c5c5c5",
  },

  // Chips row
  chipsScroll: {
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
    backgroundColor: "#121212",
  },
  chipsRow: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 8,
    flexDirection: "row",
    maxHeight: 30
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical:2,
    backgroundColor: "#121212",
    maxHeight: 32,
  },
  chipIcon: { fontSize: 14 },
  chipLabel: {
    fontSize: 13,
    color: '#D1D5DB',
    fontFamily: "PlusJakartaSans",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#121212",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    backgroundColor: "#fafafa",
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#E5E5E5',
    maxHeight: 100,
    fontFamily: "PlusJakartaSans",
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#f0a07a" },
});

export default AIChatScreen;
