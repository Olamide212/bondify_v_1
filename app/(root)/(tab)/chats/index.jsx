// app/(tabs)/chat/index.js  (or wherever your Chat tab lives)

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import bondupService from "../../../../services/bondupService";
import { matchService } from "../../../../services/matchService";
import NotificationService, { NOTIFICATION_META } from "../../../../services/notificationService";
import { socketService } from "../../../../services/socketService";

const CHAT_TABS = ["Dating", "Plans"];

// Special ID for Bondies Team chat item
const BONDIES_TEAM_CHAT_ID = 'bondies-team';

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

// Helper: extract avatar url
const bondupAvatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

// Normalize bondup group chats into chatlist-compatible items
const normalizeBondupChats = (bondups, currentUserId) =>
  bondups
    .filter((b) => b.chatId != null || (b.participants?.length || 0) >= 1)
    .map((b) => {
      const participantCount = b.participants?.length || 0;
      const creatorName = [b.createdBy?.firstName, b.createdBy?.lastName].filter(Boolean).join(" ") || "User";
      const isOwner = String(b.createdBy?._id || b.createdBy) === String(currentUserId);
      const activityEmoji = {
        coffee: '☕', food: '🍔', drinks: '🍹', gym: '💪',
        walk: '🚶', movie: '🎬', other: '✨',
      }[b.activityType] || '✨';
      return {
        id: b._id,
        matchId: b.chatId || `bondup_${b._id}`,
        name: `${activityEmoji} ${b.title}`,
        profileImage: bondupAvatar(b.createdBy),
        isOnline: false,
        isSystem: false,
        isVerified: false,
        matchedDate: b.createdAt ? new Date(b.createdAt) : new Date(),
        activityAt: new Date(b.updatedAt || b.createdAt).getTime(),
        lastMessage: `${participantCount} joined • by ${isOwner ? "You" : creatorName}`,
        unread: 0,
        hasChatted: false,
        isBondupChat: true,
        bondupId: b._id,
        bondupTitle: b.title,
        participantCount: participantCount,
      };
    })
    .sort((a, b) => b.activityAt - a.activityAt);

// ─────────────────────────────────────────────────────────────────────────────

export default function Chat() {
  const router         = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [matchUsers, setMatchUsers]       = useState([]);
  const [planChats, setPlanChats]         = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans]     = useState(true);
  const currentUserId  = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );

  // ── Load matches (dating chats) ────────────────────────────────────────────

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

  // ── Load bondup group chats (plans tab) ───────────────────────────────────

  const loadBondupChats = useCallback(async (mounted = { current: true }) => {
    setIsLoadingPlans(true);
    try {
      const [bondupRes, notifRes] = await Promise.all([
        bondupService.getMyBondups(),
        NotificationService.getNotifications({ limit: 10 }).catch(() => ({ data: [] })),
      ]);
      
      if (mounted.current) {
        const bondupChats = normalizeBondupChats(bondupRes.data ?? [], currentUserId);
        
        // Filter system notifications to show in Plans tab
        // Use category from NOTIFICATION_META to maintain consistency
        const systemNotifs = (notifRes.data ?? []).filter((n) => {
          const meta = NOTIFICATION_META[n.type];
          return meta?.category === 'system' || meta?.category === 'activity';
        });
        setSystemNotifications(systemNotifs);
        
        // Create Bondies Team chat item if there are system notifications
        const bondiesTeamItem = systemNotifs.length > 0 ? [{
          id: BONDIES_TEAM_CHAT_ID,
          matchId: BONDIES_TEAM_CHAT_ID,
          name: '🔔 Bondies Team',
          profileImage: null,
          isOnline: true,
          isSystem: true,
          isVerified: true,
          matchedDate: new Date(),
          activityAt: systemNotifs[0]?.createdAt ? new Date(systemNotifs[0].createdAt).getTime() : Date.now(),
          lastMessage: systemNotifs[0]?.body || 'Updates from Bondies',
          unread: systemNotifs.filter(n => !n.read).length,
          hasChatted: true,
          isBondiesTeam: true,
          notifications: systemNotifs,
        }] : [];
        
        setPlanChats([...bondiesTeamItem, ...bondupChats]);
      }
    } catch {
      // silent
    } finally {
      if (mounted.current) setIsLoadingPlans(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    const mounted = { current: true };
    loadMatches(mounted);
    loadBondupChats(mounted);
    return () => { mounted.current = false; };
  }, [loadMatches, loadBondupChats]);

  // Refresh list when coming back from chat (e.g. unread counts reset)
  useFocusEffect(
    useCallback(() => {
      const mounted = { current: true };
      loadMatches(mounted);
      loadBondupChats(mounted);
      return () => { mounted.current = false; };
    }, [loadMatches, loadBondupChats])
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
    // Handle Bondies Team notifications - navigate to home and trigger notifications modal
    if (user.isBondiesTeam) {
      // Navigate to home tab which has the notifications modal
      router.push({
        pathname: "/(root)/(tab)/home",
        params: { openNotifications: "true" },
      });
      return;
    }
    
    if (user.isBondupChat) {
      // Navigate to Bondup chat screen
      router.push({
        pathname: "/bondup-chat",
        params: {
          chatId: user.matchId,
          bondupId: user.bondupId,
          bondupTitle: user.bondupTitle ?? user.name,
          participantCount: String(user.participantCount ?? 0),
        },
      });
      return;
    }

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
        isVerified:   String(user.isVerified ?? false),
        matchedDate:  user.matchedDate ? user.matchedDate.toISOString() : "",
      },
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isDating = activeTab === 0;

  return (
    <View style={styles.container}>
      <ChatListScreen
        users={isDating ? matchUsers : planChats}
        onSelectUser={handleSelectUser}
        isLoading={isDating ? isLoadingMatches : isLoadingPlans}
        chatType={isDating ? "dating" : "social"}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={CHAT_TABS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});