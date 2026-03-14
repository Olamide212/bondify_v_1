// components/ChatScreen.js

import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../constant/colors";
import { matchService } from "../../services/matchService";
import { messageService } from "../../services/messageService";
import { socketService } from "../../services/socketService";
import { formatRelativeDate } from "../../utils/helper";
import Header from "../headers/ChatHeader";
import BaseModal from "../modals/BaseModal";
import BlockReportModal from "../modals/Blockreportmodal";
import InputToolbar from "./InputToolbar";
import MessageBubble from "./MessageBubble";

const MESSAGE_PAGE_SIZE = 20;
const LOAD_OLDER_TRIGGER_PX = 140;

// Play the message sent sound (fire-and-forget, errors are swallowed)
const playSentSound = async () => {
  let sound;
  try {
    const result = await Audio.Sound.createAsync(
      require("../../assets/sounds/match.wav"),
      { volume: 0.4 }
    );
    sound = result.sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    // non-critical: ignore audio errors
    if (sound) sound.unloadAsync().catch(() => {});
  }
};

const ChatScreen = ({ matchedUser, onBack }) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Typing indicator handlers
  useEffect(() => {
    if (!matchedUser?.matchId) return;

    const handleTyping = ({ matchId, userId }) => {
      if (String(matchId) !== String(matchedUser.matchId) || String(userId) === String(currentUserId)) return;
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
    };
    const handleStopTyping = ({ matchId, userId }) => {
      if (String(matchId) !== String(matchedUser.matchId) || String(userId) === String(currentUserId)) return;
      setIsTyping(false);
    };
    socketService.on("typing", handleTyping);
    socketService.on("stop_typing", handleStopTyping);
    return () => {
      socketService.off("typing", handleTyping);
      socketService.off("stop_typing", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchedUser?.matchId, currentUserId]);

  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Block / Report modal state (uses shared BlockReportModal)
  const [blockReportModal, setBlockReportModal] = useState({ visible: false, mode: "block" });

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
          mediaUrl: message.mediaUrl ?? message.imageUrl,
          mediaDuration: message.mediaDuration,
          timestamp: message.createdAt ? new Date(message.createdAt) : new Date(),
          sender: isSender ? "me" : "them",
          status,
          type: message.type || type,
          voiceDuration: message.mediaDuration
            ? Math.max(1, Math.round(message.mediaDuration / 1000))
            : undefined,
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
        setIsInitialLoading(false);
        return;
      }

      setIsInitialLoading(true);

      const cachedMessages = await messageService.getCachedMessages(
        matchedUser.matchId,
        { limit: MESSAGE_PAGE_SIZE }
      );

      if (isMounted && cachedMessages.length > 0) {
        setMessages(normalizeMessages(cachedMessages));
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
          if (cachedMessages.length === 0) {
            setMessages([]);
          }
          setNextCursor(null);
          setHasMoreMessages(false);
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
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

  // Send message
  const sendMessage = async (
    text,
    imageUrl,
    voiceNote,
    options = {}
  ) => {
    if (!text && !imageUrl && !voiceNote) return;
    const tempId = `temp-${Date.now()}`;
    const mediaDuration = options.mediaDuration;
    const messageType =
      options.type || (imageUrl ? "image" : voiceNote ? "voice" : "text");
    const newMessage = {
      id: tempId,
      text,
      imageUrl,
      mediaUrl: imageUrl,
      voiceNote,
      voiceDuration:
        typeof mediaDuration === "number" && mediaDuration > 0
          ? Math.max(1, Math.round(mediaDuration / 1000))
          : undefined,
      timestamp: new Date(),
      sender: "me",
      status: "sent",
      type: messageType,
      mediaDuration,
    };
    setMessages((prev) => [...prev, newMessage]);

    if (!matchedUser?.matchId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return;
    }

    try {
      const payload = {
        content: text || "",
        type: messageType,
        mediaUrl: imageUrl,
        mediaDuration,
      };
      const savedMessage = await messageService.sendMessage(
        matchedUser.matchId,
        payload
      );
      const normalizedMessage = normalizeMessages([savedMessage])[0];
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? normalizedMessage : msg))
      );
      // Play sent sound (non-blocking)
      playSentSound();
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      console.error("Failed to send message:", {
        matchId: matchedUser?.matchId,
        error,
      });
    }
  };

  const handleSendImage = async ({ uri, fileName, mimeType }) => {
    const uploaded = await messageService.uploadChatMedia({
      uri,
      fileName,
      mimeType,
    });

    await sendMessage("", uploaded.mediaUrl, false, { type: "image" });
  };

  const handleSendVoice = async ({ uri, fileName, mimeType, durationMs }) => {
    const uploaded = await messageService.uploadChatMedia({
      uri,
      fileName,
      mimeType,
    });

    await sendMessage("", uploaded.mediaUrl, true, {
      type: "voice",
      mediaDuration: durationMs,
    });
  };

  if (!matchedUser) return null;

  const getDateKey = (dateValue) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (dateValue) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const openProfile = () => {
    if (!matchedUser?.id) return;
    router.push({
      pathname: `/user-profile/${matchedUser.id}`,
      params: { showActions: "false" },
    });
  };

  const handleUnmatch = () => {
    if (!matchedUser?.matchId || isProcessingAction) return;

    Alert.alert(
      "Unmatch",
      `Unmatch ${matchedUser.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessingAction(true);
              await matchService.unmatch(matchedUser.matchId);
              setIsActionsModalVisible(false);
              onBack?.({ unmatchedMatchId: matchedUser.matchId });
            } catch (error) {
              Alert.alert("Unable to unmatch", error?.message || "Please try again.");
            } finally {
              setIsProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    if (!matchedUser?.id || isProcessingAction) return;
    setIsActionsModalVisible(false);
    // Wait for the actions sheet close animation to finish before opening the next modal
    setTimeout(() => setBlockReportModal({ visible: true, mode: "block" }), 350);
  };

  const handleReport = () => {
    if (!matchedUser?.id || isProcessingAction) return;
    setIsActionsModalVisible(false);
    setTimeout(() => setBlockReportModal({ visible: true, mode: "report" }), 350);
  };

  return (
    <SafeAreaView className='flex-1' edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? StatusBar.currentHeight : 0}
      >
        <Header
          matchedUser={matchedUser}
          onBack={() => onBack?.()}
          onOpenProfile={openProfile}
          onOpenActions={matchedUser?.isSystem ? undefined : () => setIsActionsModalVisible(true)}
          onUnmatch={matchedUser?.isSystem ? undefined : () => router.push("/unmatched-users")}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
              <ActivityIndicator size='small' color={colors.primary} />
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

          {messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const showDateSeparator =
              index === 0 ||
              getDateKey(message.timestamp) !== getDateKey(previousMessage?.timestamp);

            return (
              <View key={message.id}>
                {showDateSeparator && (
                  <View style={styles.dateSeparatorContainer}>
                    <View style={styles.dateSeparatorPill}>
                      <Text style={styles.dateSeparatorText}>
                        {formatDateLabel(message.timestamp)}
                      </Text>
                    </View>
                  </View>
                )}
                <MessageBubble message={message} />
              </View>
            );
          })}

          {isTyping && (
            <View style={{ alignItems: "flex-start", marginLeft: 16, marginBottom: 8 }}>
              <Text style={{ color: "#6B7280", fontStyle: "italic" }}>Typing...</Text>
            </View>
          )}
          {isInitialLoading && messages.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <ActivityIndicator size='small' color={colors.primary} />
            </View>
          )}

          {!isInitialLoading && messages.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Send the first message to start the conversation.
              </Text>
            </View>
          )}
        </ScrollView>

        {!matchedUser?.isSystem && (
          <InputToolbar
            sendMessage={sendMessage}
            onSendImage={handleSendImage}
            onSendVoice={handleSendVoice}
            matchId={matchedUser?.matchId}
            currentUserId={currentUserId}
          />
        )}

        {/* ── Actions sheet — hidden for system/team chats ── */}
        {!matchedUser?.isSystem && (
          <>
            <BaseModal
              visible={isActionsModalVisible}
              onClose={() => !isProcessingAction && setIsActionsModalVisible(false)}
            >
              <View style={styles.actionsModalContainer}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleUnmatch}
                  disabled={isProcessingAction}
                >
                  <Text style={styles.actionDangerText}>Unmatch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleBlock}
                  disabled={isProcessingAction}
                >
                  <Text style={styles.actionDangerText}>Block</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleReport}
                  disabled={isProcessingAction}
                >
                  <Text style={styles.actionDangerText}>Report</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => setIsActionsModalVisible(false)}
                  disabled={isProcessingAction}
                >
                  <Text style={styles.actionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </BaseModal>

            {/* ── Block / Report modal (shared component) ── */}
            <BlockReportModal
              visible={blockReportModal.visible}
              mode={blockReportModal.mode}
              profile={{
                _id:       matchedUser.id,
                name:      matchedUser.name,
                images:    matchedUser.profileImage ? [matchedUser.profileImage] : [],
              }}
              onClose={() => setBlockReportModal((prev) => ({ ...prev, visible: false }))}
              onSuccess={(mode) => {
                setBlockReportModal((prev) => ({ ...prev, visible: false }));
                if (mode === "block") {
                  // Navigate back and remove the match from the list
                  onBack?.({ unmatchedMatchId: matchedUser.matchId, blocked: true });
                }
              }}
            />
          </>
        )}
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
    backgroundColor: '#fff',
  },
  messagesContent: {
    paddingVertical: 16,
  },
  matchBanner: {
    alignItems: "center",
    marginBottom: 16,
  },
  dateSeparatorContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  dateSeparatorPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  loadingOlderContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
  bannerContent: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerText: {
    color: colors.primary,
    fontSize: 12,
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
  actionsModalContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  actionItem: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  actionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  actionDangerText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
  actionCancelText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  // Report / Block handled by BlockReportModal
});

export default ChatScreen;