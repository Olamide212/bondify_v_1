// components/ChatScreen.js

import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import { Copy, Edit2, Mail, MessageCircle, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../constant/colors";
import { useAlert } from "../../context/AlertContext";
import { messageService } from "../../services/messageService";
import { socketService } from "../../services/socketService";
import cacheManager from "../../utils/cacheManager";
import { formatRelativeDate } from "../../utils/helper";
import Header from "../headers/ChatHeader";
import InputToolbar from "./InputToolbar";
import MessageBubble from "./MessageBubble";

const MESSAGE_PAGE_SIZE = 20;
const LOAD_OLDER_TRIGGER_PX = 140;

const ChatScreen = ({ matchedUser, onBack, initialSearchMode = false }) => {
  const { showAlert } = useAlert();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(initialSearchMode);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Reply/Edit state
  const [replyTo, setReplyTo] = useState(null); // message object
  const [editMessage, setEditMessage] = useState(null); // message object

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

  // Cache matched user profile data to avoid repeated API calls
  useEffect(() => {
    if (!matchedUser?.id) return;
    const cacheKey = `user_${matchedUser.id}`;
    cacheManager.set("chat_profiles", cacheKey, matchedUser, 24 * 60 * 60 * 1000); // 24 hours TTL
  }, [matchedUser]);

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
      // Play message delivered sound
      playSound(require("../../assets/sounds/message-ping.mp3"));
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
      // Play message read sound
      // playSound(require("../../assets/sounds/message-read.mp3"));
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
      if (__DEV__) console.warn("[ChatScreen] Sound playback failed:", error);
    }
  };

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
      // Play message sent sound
      // playSound(require("../../assets/sounds/message-sent.mp3"));
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

  const openChatOptions = () => {
    if (!matchedUser) return;
    router.push({
      pathname: "/chat-options",
      params: {
        matchId:      matchedUser.matchId ?? "",
        userId:       matchedUser.id ?? "",
        name:         matchedUser.name ?? "",
        profileImage: matchedUser.profileImage ?? "",
        isVerified:   String(matchedUser.isVerified ?? false),
      },
    });
  };

  // Search helpers
  const openSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        (m.text || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Activate search when initialSearchMode changes (e.g. navigating back from chat-options)
  useEffect(() => {
    if (initialSearchMode) openSearch();
  }, [initialSearchMode]);

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
          onOpenActions={openChatOptions}
          onOpenSearch={openSearch}
        />

        {/* ── Search bar ── */}
        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Text style={styles.searchCount}>
                {filteredMessages.length} found
              </Text>
            )}
            <TouchableOpacity onPress={closeSearch} hitSlop={8}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

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

          {!matchedUser?.isSystem && (
            <View style={styles.matchBanner}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerText}>
                  You matched with {matchedUser.name}{" "}
                  {formatRelativeDate(matchedUser.matchedDate)}
                </Text>
              </View>
            </View>
          )}


          {filteredMessages.map((message, index) => {
            const previousMessage = filteredMessages[index - 1];
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
                <MessageBubble
                  message={message}
                  highlight={searchQuery.trim()}
                  onReply={(msg) => setReplyTo(msg)}
                  onEdit={(msg) => {
                    // Only allow edit within 30s of sending
                    const now = Date.now();
                    const sent = message.timestamp instanceof Date ? message.timestamp.getTime() : new Date(message.timestamp).getTime();
                    // if (now - sent > 30000) {
                    //   Alert.alert("Edit Expired", "You can only edit a message within 30 seconds of sending.");
                    //   return;
                    // }
                    setEditMessage(msg);
                  }}
                  EditIcon={Edit2}
                  CopyIcon={Copy}
                />
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

        {matchedUser?.isSystem ? (
          /* ── Contact Us bar (system / team chats) ── */
          <View style={styles.contactBar}>
            <Text style={styles.contactBarLabel}>
              Need help? Reach us directly
            </Text>
            <View style={styles.contactBarButtons}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL('mailto:support@bondies.app')}
                activeOpacity={0.82}
              >
                <Mail size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.contactBtnText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, styles.contactBtnPrimary]}
                onPress={() => Linking.openURL('https://wa.me/2348000000000')}
                activeOpacity={0.82}
              >
                <MessageCircle size={18} color="#fff" strokeWidth={2} />
                <Text style={[styles.contactBtnText, styles.contactBtnTextWhite]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <InputToolbar
            sendMessage={async (text, opts) => {
              if (opts?.edit && editMessage) {
                try {
                  const updated = await messageService.editMessage(editMessage.id, text);
                  setMessages((msgs) =>
                    msgs.map((m) =>
                      m.id === editMessage.id ? { ...m, text: updated.content, edited: true } : m
                    )
                  );
                } catch (err) {
                  showAlert({
                    icon: 'error',
                    title: 'Edit Failed',
                    message: err.message || 'Could not edit message.',
                  });
                }
              } else {
                // Normal send (with reply)
                sendMessage(text, opts?.replyTo ? undefined : undefined, undefined, opts?.replyTo ? { replyTo: opts.replyTo.id } : undefined);
              }
            }}
            onSendImage={handleSendImage}
            onSendVoice={handleSendVoice}
            matchId={matchedUser?.matchId}
            currentUserId={currentUserId}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editMessage={editMessage}
            onCancelEdit={() => setEditMessage(null)}
          />
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

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#111",
    paddingVertical: 0,
  },
  searchCount: {
    fontSize: 12,
    fontFamily: "PlusJakartaSansMedium",
    color: "#6B7280",
    marginRight: 4,
  },

  // Contact bar (system chats)
  contactBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 20,
    gap: 10,
  },
  contactBarLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    color: '#6B7280',
    textAlign: 'center',
  },
  contactBarButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  contactBtnPrimary: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansBold',
    color: colors.primary,
  },
  contactBtnTextWhite: {
    color: '#fff',
  },
});

export default ChatScreen;