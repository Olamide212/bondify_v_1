// components/MessageBubble.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Check, CheckCheck, Mic } from "lucide-react-native";
import { formatTime } from "../../utils/helper";
import { colors } from "../../constant/colors";

const MessageBubble = ({ message }) => {
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
        <Image source={{ uri: message.imageUrl }} style={styles.image} />
      )}

      {message.type === "voice" && (
        <View
          style={[
            styles.voice,
            message.sender === "me" ? styles.myVoice : styles.theirVoice,
          ]}
        >
          <Mic
            size={18}
            color={message.sender === "me" ? "white" : "#6B7280"}
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
        </View>
      )}

      <View
        style={[
          styles.meta,
          message.sender === "me" ? styles.myMeta : styles.theirMeta,
        ]}
      >
        <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
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
