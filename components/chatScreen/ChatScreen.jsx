// components/ChatScreen.js
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { messageService } from "../../services/messageService";
import { socketService } from "../../services/socketService";
import { formatRelativeDate } from "../../utils/helper";
import Header from "../headers/ChatHeader";
import InputToolbar from "./InputToolbar";
import MessageBubble from "./MessageBubble";

const MESSAGE_PAGE_SIZE = 20;
const LOAD_OLDER_TRIGGER_PX = 140;

const ChatScreen = ({ matchedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const scrollViewRef = useRef(null);
  const contentHeightRef = useRef(0);
  const scrollOffsetYRef = useRef(0);
  const prependAnchorRef = useRef(null);
  const skipNextAutoScrollRef = useRef(false);
  const currentUserId = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );

  const normalizeMessages = useCallback(
    (messagesData = []) =>
      messagesData.map((message) => {
        const senderId = message.sender?._id;
        const isSender =
          senderId && currentUserId
            ? String(senderId) === String(currentUserId)
            : false;
        const status = message.read
          ? "read"
          : message.delivered
            ? "delivered"
            : "sent";
        const type = message.type || (message.mediaUrl ? "image" : "text");

        return {
          id: message._id ?? message.id,
          text: message.content ?? "",
          imageUrl: message.mediaUrl ?? message.imageUrl,
          timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
          sender: isSender ? "me" : "them",
          status,
          type,
        };
      }),
    [currentUserId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!matchedUser?.matchId) {
        setMessages([]);
        setNextCursor(null);
        setHasMoreMessages(false);
        return;
      }
      try {
        const response = await messageService.getMessages(
          matchedUser.matchId,
          { limit: MESSAGE_PAGE_SIZE },
          { includePagination: true }
        );
        const responseMessages = response?.messages ?? [];
        if (isMounted) {
          setMessages(normalizeMessages(responseMessages));
          setNextCursor(response?.pagination?.nextCursor ?? null);
          setHasMoreMessages(Boolean(response?.pagination?.hasMore));
        }
      } catch (_error) {
        if (isMounted) {
          setMessages([]);
          setNextCursor(null);
          setHasMoreMessages(false);
        }
      }
    };

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [matchedUser?.matchId, normalizeMessages]);

  const loadOlderMessages = useCallback(async () => {
    if (
      !matchedUser?.matchId ||
      !hasMoreMessages ||
      !nextCursor ||
      isLoadingOlder
    ) {
      return;
    }

    setIsLoadingOlder(true);

    try {
      const previousHeight = contentHeightRef.current;
      const previousOffset = scrollOffsetYRef.current;

      const response = await messageService.getMessages(
        matchedUser.matchId,
        { cursor: nextCursor, limit: MESSAGE_PAGE_SIZE },
        { includePagination: true }
      );

      const olderMessages = normalizeMessages(response?.messages ?? []);
      setNextCursor(response?.pagination?.nextCursor ?? null);
      setHasMoreMessages(Boolean(response?.pagination?.hasMore));

      if (olderMessages.length > 0) {
        prependAnchorRef.current = {
          previousHeight,
          previousOffset,
        };
        skipNextAutoScrollRef.current = true;

        setMessages((prevMessages) => {
          const existingIds = new Set(prevMessages.map((msg) => String(msg.id)));
          const uniqueOlder = olderMessages.filter(
            (msg) => !existingIds.has(String(msg.id))
          );

          if (uniqueOlder.length === 0) {
            prependAnchorRef.current = null;
            skipNextAutoScrollRef.current = false;
            return prevMessages;
          }

          return [...uniqueOlder, ...prevMessages];
        });
      }
    } catch (_error) {
      // no-op: keep current list if older messages fetch fails
    } finally {
      setIsLoadingOlder(false);
    }
  }, [hasMoreMessages, isLoadingOlder, matchedUser?.matchId, nextCursor, normalizeMessages]);

  useEffect(() => {
    if (!matchedUser?.matchId) {
      return undefined;
    }

    let isMounted = true;

    const handleMessageNew = ({ matchId, message }) => {
      if (!message || String(matchId) !== String(matchedUser.matchId)) return;

      const senderId = message.sender?._id || message.sender?.id || message.sender;
      const isSentByCurrentUser =
        senderId && currentUserId
          ? String(senderId) === String(currentUserId)
          : false;

      if (isSentByCurrentUser) {
        return;
      }

      const normalizedIncoming = normalizeMessages([message])[0];

      setMessages((prevMessages) => {
        const exists = prevMessages.some(
          (item) => String(item.id) === String(normalizedIncoming.id)
        );
        if (exists) {
          return prevMessages;
        }
        return [...prevMessages, normalizedIncoming];
      });
    };

    const handleMessageDelivered = ({ matchId, messageId }) => {
      if (!messageId || String(matchId) !== String(matchedUser.matchId)) return;

      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          String(message.id) === String(messageId) && message.sender === "me"
            ? { ...message, status: "delivered" }
            : message
        )
      );
    };

    const handleMessagesRead = ({ matchId, byUserId }) => {
      if (
        !byUserId ||
        String(matchId) !== String(matchedUser.matchId) ||
        String(byUserId) === String(currentUserId)
      ) {
        return;
      }

      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.sender === "me"
            ? { ...message, status: "read" }
            : message
        )
      );
    };

    const connectAndJoin = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;

      socketService.joinMatch(matchedUser.matchId);
      socketService.on("message:new", handleMessageNew);
      socketService.on("message:delivered", handleMessageDelivered);
      socketService.on("messages:read", handleMessagesRead);
    };

    connectAndJoin();

    return () => {
      isMounted = false;
      socketService.leaveMatch(matchedUser.matchId);
      socketService.off("message:new", handleMessageNew);
      socketService.off("message:delivered", handleMessageDelivered);
      socketService.off("messages:read", handleMessagesRead);
    };
  }, [currentUserId, matchedUser?.matchId, normalizeMessages]);

  useEffect(() => {
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false;
      return;
    }

    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text, imageUrl, voiceNote) => {
    if (!text && !imageUrl && !voiceNote) return;
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      text,
      imageUrl,
      voiceNote,
      voiceDuration: voiceNote ? Math.floor(Math.random() * 30) + 5 : undefined,
      timestamp: new Date(),
      sender: "me",
      status: "sent",
      type: imageUrl ? "image" : voiceNote ? "voice" : "text",
    };
    setMessages((prev) => [...prev, newMessage]);

    if (!matchedUser?.matchId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return;
    }

    try {
      const payload = {
        content: text,
        type: imageUrl ? "image" : "text",
        mediaUrl: imageUrl,
      };
      const savedMessage = await messageService.sendMessage(
        matchedUser.matchId,
        payload
      );
      const normalizedMessage = normalizeMessages([savedMessage])[0];
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? normalizedMessage : msg))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      console.error("Failed to send message:", {
        matchId: matchedUser?.matchId,
        error,
      });
    }
  };

  if (!matchedUser) return null;

  return (
    <SafeAreaView className='flex-1'>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <Header matchedUser={matchedUser} onBack={onBack} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            scrollOffsetYRef.current = offsetY;

            if (offsetY <= LOAD_OLDER_TRIGGER_PX) {
              loadOlderMessages();
            }
          }}
          scrollEventThrottle={16}
          onContentSizeChange={(_width, height) => {
            const anchor = prependAnchorRef.current;

            if (anchor) {
              const delta = Math.max(height - anchor.previousHeight, 0);
              const nextOffset = anchor.previousOffset + delta;

              requestAnimationFrame(() => {
                scrollViewRef.current?.scrollTo({ y: nextOffset, animated: false });
              });

              prependAnchorRef.current = null;
            }

            contentHeightRef.current = height;
          }}
        >
          {isLoadingOlder && (
            <View style={styles.loadingOlderContainer}>
              <ActivityIndicator size='small' color='#9CA3AF' />
            </View>
          )}

          <View style={styles.matchBanner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerText}>
                You matched with {matchedUser.name}{" "}
                {formatRelativeDate(matchedUser.matchedDate)}
              </Text>
            </View>
          </View>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {messages.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Send the first message to start the conversation.
              </Text>
            </View>
          )}
        </ScrollView>

        <View>
          <InputToolbar sendMessage={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  messagesContent: {
    paddingVertical: 16,
  },
  matchBanner: {
    alignItems: "center",
    marginBottom: 16,
  },
  loadingOlderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
  bannerContent: {
    backgroundColor: "#FCE7F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerText: {
    color: "#EC4899",
    fontSize: 12,
  },
  messageBubbleContainer: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  theirMessageBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 16,
  },
  theirMessageText: {
    color: "#1F2937",
  },
  emptyStateContainer: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ChatScreen;
