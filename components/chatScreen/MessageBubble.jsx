// components/MessageBubble.js
import { Audio } from "expo-av";
import { Check, CheckCheck, Mic, Pause, Play, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

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

const MessageBubble = ({ message }) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(Boolean(message.imageUrl));
  const [imageFailed, setImageFailed] = useState(!message.imageUrl);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const handleVoicePress = async () => {
    const voiceUrl = message.mediaUrl || message.imageUrl;
    if (!voiceUrl) return;

    if (soundRef.current) {
      if (isPlayingVoice) {
        await soundRef.current.pauseAsync();
        setIsPlayingVoice(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlayingVoice(true);
      }
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: voiceUrl },
      { shouldPlay: true }
    );

    soundRef.current = sound;
    setIsPlayingVoice(true);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status?.isLoaded) return;

      setIsPlayingVoice(status.isPlaying);

      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        soundRef.current = null;
        setIsPlayingVoice(false);
      }
    });
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

  return (
    <View
      style={[
        styles.container,
        message.sender === "me" ? styles.myContainer : styles.theirContainer,
      ]}
    >
      {message.type === "text" && (
        <View
          style={[
            styles.bubble,
            message.sender === "me" ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.text,
              message.sender === "me" ? styles.myText : styles.theirText,
            ]}
          >
            {message.text}
          </Text>
        </View>
      )}

      {message.type === "image" && (
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
      )}

      {message.type === "voice" && (
        <TouchableOpacity
          style={[
            styles.voice,
            message.sender === "me" ? styles.myVoice : styles.theirVoice,
          ]}
          onPress={handleVoicePress}
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  text: {
    fontSize: 16,
  },
  myText: {
    color: "#fff",
  },
  theirText: {
    color: "#1F2937",
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
});

export default MessageBubble;
