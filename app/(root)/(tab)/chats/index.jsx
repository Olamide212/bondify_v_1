// app/(tabs)/chat/index.js  (or wherever your Chat tab lives)

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import { matchService } from "../../../../services/matchService";
import { socketService } from "../../../../services/socketService";

// ─── helpers ─────────────────────────────────────────────────────────────────

const getActivityTimestamp = (entry) => {
  const raw = entry?.lastMessageAt || entry?.matchedAt || entry?.activityAt;
  if (!raw) return 0;
  if (typeof raw === "number") return Number.isNaN(raw) ? 0 : raw;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortByActivity = (users) =>
  [...users].sort((a, b) => {
    const diff = getActivityTimestamp(b) - getActivityTimestamp(a);
    if (diff !== 0) return diff;
    return String(a?.matchId ?? a?.id ?? "").localeCompare(
      String(b?.matchId ?? b?.id ?? "")
    );
  });

const getFirstName = (fullName) => {
  const s = String(fullName || "").trim();
  if (!s) return "Unknown";
  return s.split(/\s+/)[0];
};

const normalizeMatches = (matches) =>
  sortByActivity(matches).map((match) => {
    const images = Array.isArray(match.user?.images)
      ? match.user.images
          .map((img) =>
            typeof img === "string" ? img : img?.url || img?.uri || img?.secure_url
          )
          .filter(Boolean)
      : [];

    const profileImage = images[0] || match.user?.profileImage;
    const hasChatted   = Boolean(match.lastMessageAt);
    const latestMessage = match.lastMessage?.content;

    return {
      id:           match.user?._id ?? match.user?.id,
      matchId:      match.matchId ?? match.id,
      name:         match.user?.isSystem
        ? ([match.user?.firstName, match.user?.lastName].filter(Boolean).join(' ') || 'Bondies Team')
        : getFirstName(
            match.user?.name ||
              [match.user?.firstName, match.user?.lastName].filter(Boolean).join(' ') ||
              'Unknown'
          ),
      profileImage,
      isOnline:     match.user?.online ?? false,
      isSystem:     match.user?.isSystem ?? false,
      isVerified:   match.user?.verificationStatus === 'approved' || !!match.user?.verified,
      matchedDate:  match.matchedAt ? new Date(match.matchedAt) : new Date(),
      activityAt:   getActivityTimestamp(match),
      lastMessage:  latestMessage || (hasChatted ? 'Tap to continue chatting' : 'No messages yet'),
      unread:       Number(match.unread || 0),
      hasChatted,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────

export default function Chat() {
  const router         = useRouter();
  const [matchUsers, setMatchUsers]       = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const currentUserId  = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );

  // ── Load matches ────────────────────────────────────────────────────────────

  const loadMatches = useCallback(async (mounted = { current: true }) => {
    setIsLoadingMatches(true);
    try {
      const cached = await matchService.getCachedMatches();
      if (mounted.current && cached.length > 0) setMatchUsers(normalizeMatches(cached));

      const fresh = await matchService.getMatches();
      if (mounted.current) setMatchUsers(fresh.length > 0 ? normalizeMatches(fresh) : []);
    } catch {
      const fallback = await matchService.getCachedMatches();
      if (mounted.current) setMatchUsers(fallback.length > 0 ? normalizeMatches(fallback) : []);
    } finally {
      if (mounted.current) setIsLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    loadMatches(mounted);
    return () => { mounted.current = false; };
  }, [loadMatches]);

  // Refresh list when coming back from chat (e.g. unread counts reset)
  useFocusEffect(
    useCallback(() => {
      const mounted = { current: true };
      loadMatches(mounted);
      return () => { mounted.current = false; };
    }, [loadMatches])
  );

  // ── Socket updates ──────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const handleMessageNew = ({ matchId, message }) => {
      if (!matchId || !message || !isMounted) return;

      const senderId           = message.sender?._id || message.sender?.id || message.sender;
      const isSentByMe         = senderId && currentUserId
        ? String(senderId) === String(currentUserId)
        : false;

      const previewText = message.content ||
        (message.type === "image" ? "Sent a photo" :
         message.type === "voice" ? "Sent a voice note" : "New message");

      const activityAt = (() => {
        const p = new Date(message.createdAt || Date.now()).getTime();
        return Number.isNaN(p) ? Date.now() : p;
      })();

      setMatchUsers((prev) =>
        sortByActivity(
          prev.map((u) =>
            String(u.matchId) !== String(matchId)
              ? u
              : {
                  ...u,
                  hasChatted: true,
                  activityAt,
                  lastMessage: previewText,
                  unread: isSentByMe ? u.unread : Number(u.unread || 0) + 1,
                }
          )
        )
      );
    };

    const handleMessagesRead = ({ matchId, byUserId }) => {
      if (!matchId || !byUserId || String(byUserId) !== String(currentUserId)) return;
      setMatchUsers((prev) =>
        prev.map((u) =>
          String(u.matchId) === String(matchId) ? { ...u, unread: 0 } : u
        )
      );
    };

    const connect = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;
      socketService.on("message:new", handleMessageNew);
      socketService.on("messages:read", handleMessagesRead);
    };

    connect();

    return () => {
      isMounted = false;
      socketService.off("message:new", handleMessageNew);
      socketService.off("messages:read", handleMessagesRead);
    };
  }, [currentUserId]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleSelectUser = (user) => {
    // Optimistically clear unread badge before navigating
    setMatchUsers((prev) =>
      prev.map((u) =>
        String(u.matchId) === String(user.matchId) ? { ...u, unread: 0 } : u
      )
    );

    router.push({
      pathname: "/chat-screen",
      params: {
        matchId:      user.matchId,
        userId:       user.id,
        name:         user.name,
        profileImage: user.profileImage ?? "",
        isOnline:     String(user.isOnline ?? false),
        isSystem:     String(user.isSystem ?? false),
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ChatListScreen
        users={matchUsers}
        onSelectUser={handleSelectUser}
        isLoading={isLoadingMatches}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});