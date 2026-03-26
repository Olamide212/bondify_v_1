// components/MessageBubble.js
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Check, CheckCheck, Mic, Pause, Play, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Clipboard,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from "react-native";
import { colors } from "../../constant/colors";
import { fonts } from "../../constant/fonts";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];

const formatMessageDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** Split text around a search term and wrap matches in a highlight span */
const highlightText = (text, term, textStyle) => {
  if (!term || !text) return <Text style={textStyle}>{text}</Text>;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  if (parts.length === 1) return <Text style={textStyle}>{text}</Text>;
  return (
    <Text style={textStyle}>
      {parts.map((part, i) =>
        regex.test(part)
          ? <Text key={i} style={{ backgroundColor: "#FBBF24", color: "#000", borderRadius: 2 }}>{part}</Text>
          : part
      )}
    </Text>
  );
};

const MessageBubble = ({ message, onReply, onEdit, highlight, isSystem = false }) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(Boolean(message.imageUrl));
  const [imageFailed, setImageFailed] = useState(!message.imageUrl);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reaction, setReaction] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const handleVoicePress = async () => {
    const voiceUrl = message.mediaUrl || message.imageUrl;
    if (!voiceUrl) return;

    // Toggle pause/resume if player already exists
    if (playerRef.current) {
      if (isPlayingVoice) {
        playerRef.current.pause();
        setIsPlayingVoice(false);
      } else {
        playerRef.current.play();
        setIsPlayingVoice(true);
      }
      return;
    }

    // Fresh load + play
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      const player = createAudioPlayer({ uri: voiceUrl });
      playerRef.current = player;
      setIsPlayingVoice(true);

      player.addListener('playbackStatusUpdate', (status) => {
        if (!status.isLoaded) return;
        setIsPlayingVoice(status.isPlaying ?? false);
        if (status.didJustFinish) {
          player.removeAllListeners('playbackStatusUpdate');
          player.remove();
          playerRef.current = null;
          setIsPlayingVoice(false);
        }
      });

      player.play();
    } catch {
      setIsPlayingVoice(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <Check color="#9CA3AF" size={12} />;
      case "delivered":
        return <CheckCheck color="#9CA3AF" size={12} />;
      case "read":
        return <CheckCheck color={colors.primary} size={12} />;
      default:
        return null;
    }
  };

  const handleCopy = async () => {
    if (!message.text) return;
    Clipboard.setString(message.text);
    setMenuVisible(false);
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied!", ToastAndroid.SHORT);
    }
  };

  const handleReply = () => {
    setMenuVisible(false);
    onReply?.(message);
  };

  const handleReaction = (emoji) => {
    setReaction(emoji);
    setMenuVisible(false);
  };

  const isOwn = message.sender === "me";

  return (
    <View
      style={[
        styles.container,
        message.sender === "me" ? styles.myContainer : styles.theirContainer,
      ]}
    >
      {/* Reaction badge */}
      {reaction && (
        <View style={[
          styles.reactionBadge,
          message.sender === "me" ? styles.reactionBadgeLeft : styles.reactionBadgeRight,
        ]}>
          <Text style={styles.reactionEmoji}>{reaction}</Text>
        </View>
      )}

      {message.replyTo && (
        <View style={{
          backgroundColor: '#F3F4F6',
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 8,
          marginBottom: 2,
          maxWidth: '80%',
          alignSelf: message.sender === "me" ? 'flex-end' : 'flex-start',
        }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12, marginBottom: 2 }} numberOfLines={1}>
            {message.replyTo.senderName || (message.replyTo.sender === 'me' ? 'You' : 'Them')}
          </Text>
          {message.replyTo.type === 'image' && message.replyTo.imageUrl ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <User size={14} color={'#9CA3AF'} />
              <Text style={{ color: '#6B7280', fontSize: 13 }}>[Image]</Text>
            </View>
          ) : message.replyTo.type === 'voice' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Mic size={14} color={'#9CA3AF'} />
              <Text style={{ color: '#6B7280', fontSize: 13 }}>[Voice note]</Text>
            </View>
          ) : (
            <Text style={{ color: '#6B7280', fontSize: 13 }} numberOfLines={2}>
              {message.replyTo.text}
            </Text>
          )}
        </View>
      )}
      {message.type === "text" && (
        <Pressable onLongPress={isSystem ? undefined : () => setMenuVisible(true)}>
          <View
            style={[
              styles.bubble,
              message.sender === "me" ? styles.myBubble : styles.theirBubble,
            ]}
          >
            {highlightText(
              message.text,
              highlight,
              [
                styles.text,
                message.sender === "me" ? styles.myText : styles.theirText,
              ],
            )}
          </View>
        </Pressable>
      )}

      {message.type === "image" && (
        <Pressable onLongPress={isSystem ? undefined : () => setMenuVisible(true)}>
          <View style={styles.imageWrapper}>
            {!imageFailed && message.imageUrl ? (
              <Image
                source={{ uri: message.imageUrl }}
                style={styles.image}
                onLoadStart={() => {
                  setIsImageLoading(true);
                  setImageFailed(false);
                }}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageFailed(true);
                }}
              />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <User size={22} color="#94A3B8" />
              </View>
            )}

            {isImageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
        </Pressable>
      )}

      {message.type === "voice" && (
        <TouchableOpacity
          style={[
            styles.voice,
            message.sender === "me" ? styles.myVoice : styles.theirVoice,
          ]}
          onPress={handleVoicePress}
          onLongPress={isSystem ? undefined : () => setMenuVisible(true)}
          activeOpacity={0.8}
        >
          {isPlayingVoice ? (
            <Pause
              size={18}
              color={message.sender === "me" ? "white" : "#6B7280"}
            />
          ) : (
            <Play
              size={18}
              color={message.sender === "me" ? "white" : "#6B7280"}
            />
          )}
          <Mic
            size={16}
            color={message.sender === "me" ? "white" : "#6B7280"}
            style={styles.voiceMic}
          />
          <Text
            style={[
              styles.duration,
              message.sender === "me"
                ? styles.myDuration
                : styles.theirDuration,
            ]}
          >
            {message.voiceDuration}s
          </Text>
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.meta,
          message.sender === "me" ? styles.myMeta : styles.theirMeta,
        ]}
      >
        {/* <Text style={styles.time}>{formatMessageDateTime(message.timestamp)}</Text> */}
        {message.sender === "me" && getStatusIcon(message.status)}
      </View>

      {/* Context menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            {/* Emoji reactions row */}
            <View style={styles.reactionsRow}>
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiBtn}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.menuDivider} />
            {/* Actions */}
            {onReply && (
              <TouchableOpacity style={styles.menuItem} onPress={handleReply}>
                <Text style={styles.menuItemText}>↩ Reply</Text>
              </TouchableOpacity>
            )}
            {isOwn && onEdit && message.type === "text" && (() => {
              // Only show Edit if within 30s of message creation
              const EDIT_WINDOW_MS = 30 * 1000;
              const now = Date.now();
              const created = new Date(message.createdAt || message.timestamp || 0).getTime();
              if (now - created <= EDIT_WINDOW_MS) {
                return (
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onEdit(message); }}>
                    <Text style={styles.menuItemText}>✏️ Edit</Text>
                  </TouchableOpacity>
                );
              }
              return null;
            })()}
            {message.type === "text" && (
              <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
                <Text style={styles.menuItemText}>📋 Copy</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Text style={[styles.menuItemText, { color: "#9CA3AF" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  myContainer: {
    alignItems: "flex-end",
  },
  theirContainer: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#f1f1f1',
    borderTopLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    fontFamily: fonts.PlusJakartaSans,
    lineHeight: 20,
  },
  myText: {
    color: "#fff",
    fontFamily: fonts.PlusJakartaSans,
    lineHeight: 20,
  },
  theirText: {
    color: "#1F2937",
        fontFamily: fonts.PlusJakartaSans,
        lineHeight: 20,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageWrapper: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  voice: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  myVoice: {
    backgroundColor: colors.primary,
  },
  theirVoice: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  duration: {
    marginLeft: 8,
    fontSize: 14,
  },
  voiceMic: {
    marginLeft: 6,
  },
  myDuration: {
    color: "#fff",
  },
  theirDuration: {
    color: "#6B7280",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  myMeta: {
    justifyContent: "flex-end",
  },
  theirMeta: {
    justifyContent: "flex-start",
  },
  time: {
    color: "#9CA3AF",
    fontSize: 12,
    marginRight: 4,
  },
  // Context menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    paddingHorizontal: 16,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 28,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: "#111",
    fontFamily: "PlusJakartaSans",
  },
  reactionBadge: {
    position: "absolute",
    bottom: -6,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reactionBadgeLeft: {
    left: 20,
  },
  reactionBadgeRight: {
    right: 20,
  },
  reactionEmoji: {
    fontSize: 14,
  },
});

export default MessageBubble;
