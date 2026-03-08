// App.js
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import ChatScreen from "../../../../components/chatScreen/ChatScreen";
import { matchService } from "../../../../services/matchService";
import { socketService } from "../../../../services/socketService";
import { useNavigation } from "@react-navigation/native";



export default function Chat() {
  const navigation = useNavigation();
  const [currentScreen, setCurrentScreen] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);
  const [matchUsers, setMatchUsers] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const currentUserId = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );



  // Hide bottom tab bar when in chat screen
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: currentScreen === "chat"
        ? { display: "none" }
        : {
          height: 80,
          backgroundColor: "#fff",
          paddingTop: 10,
          borderTopWidth: 1,
          borderColor: "#F1F5F9",
        },
    });
  }, [currentScreen, navigation]);

  // get user activity timestamp for sorting
  const getUserActivityTimestamp = (user) => {
    const rawActivity = user?.activityAt || user?.matchedDate;
    if (!rawActivity) return 0;

    if (typeof rawActivity === "number") {
      return Number.isNaN(rawActivity) ? 0 : rawActivity;
    }

    const parsed = new Date(rawActivity).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortUsersByActivity = (users) =>
    [...users].sort((a, b) => {
      const activityDiff =
        getUserActivityTimestamp(b) - getUserActivityTimestamp(a);
      if (activityDiff !== 0) return activityDiff;

      const aId = String(a?.matchId ?? a?.id ?? "");
      const bId = String(b?.matchId ?? b?.id ?? "");
      return aId.localeCompare(bId);
    });

  useEffect(() => {
    let isMounted = true;

    const getActivityTimestamp = (match) => {
      const latestActivity = match?.lastMessageAt || match?.matchedAt;
      if (!latestActivity) return 0;

      const parsedDate = new Date(latestActivity).getTime();
      return Number.isNaN(parsedDate) ? 0 : parsedDate;
    };

    const normalizeMatches = (matches) =>
      [...matches]
        .sort((a, b) => {
          const activityDiff = getActivityTimestamp(b) - getActivityTimestamp(a);
          if (activityDiff !== 0) return activityDiff;

          const aId = String(a?.matchId ?? a?.id ?? a?.user?._id ?? a?.user?.id ?? "");
          const bId = String(b?.matchId ?? b?.id ?? b?.user?._id ?? b?.user?.id ?? "");
          return aId.localeCompare(bId);
        })
        .map((match) => {
          const getFirstName = (fullName) => {
            const normalized = String(fullName || "").trim();
            if (!normalized) return "Unknown";
            return normalized.split(/\s+/)[0];
          };

          const images = Array.isArray(match.user?.images)
            ? match.user.images
              .map((image) =>
                typeof image === "string"
                  ? image
                  : image?.url || image?.uri || image?.secure_url
              )
              .filter(Boolean)
            : [];
          const profileImage = images[0] || match.user?.profileImage;
          const hasChatted = Boolean(match.lastMessageAt);
          const latestMessage = match.lastMessage?.content;

          return {
            id: match.user?._id ?? match.user?.id,
            matchId: match.matchId ?? match.id,
            name:
              getFirstName(
                match.user?.name ||
                [match.user?.firstName, match.user?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                "Unknown"
              ),
            profileImage,
            isOnline: match.user?.online ?? false,
            matchedDate: match.matchedAt
              ? new Date(match.matchedAt)
              : new Date(),
            activityAt: getActivityTimestamp(match),
            lastMessage: latestMessage || (hasChatted ? "Tap to continue chatting" : "No messages yet"),
            unread: Number(match.unread || 0),
            hasChatted,
          };
        });

    const loadMatches = async () => {
      setIsLoadingMatches(true);

      try {
        const cachedMatches = await matchService.getCachedMatches();

        if (isMounted && cachedMatches.length > 0) {
          setMatchUsers(normalizeMatches(cachedMatches));
        }

        const matches = await matchService.getMatches();
        if (isMounted) {
          setMatchUsers(matches.length > 0 ? normalizeMatches(matches) : []);
        }
      } catch (_error) {
        if (isMounted) {
          const fallbackCachedMatches = await matchService.getCachedMatches();
          setMatchUsers(
            fallbackCachedMatches.length > 0
              ? normalizeMatches(fallbackCachedMatches)
              : []
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMatches(false);
        }
      }
    };

    loadMatches();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleMessageNew = ({ matchId, message }) => {
      if (!matchId || !message) return;

      const senderId = message.sender?._id || message.sender?.id || message.sender;
      const isSentByCurrentUser =
        senderId && currentUserId
          ? String(senderId) === String(currentUserId)
          : false;
      const isCurrentChatOpen =
        currentScreen === "chat" &&
        selectedUser?.matchId &&
        String(selectedUser.matchId) === String(matchId);

      const previewText =
        message.content ||
        (message.type === "image"
          ? "Sent a photo"
          : message.type === "voice"
            ? "Sent a voice note"
            : "New message");

      const messageActivityAt = (() => {
        const parsed = new Date(message.createdAt || Date.now()).getTime();
        return Number.isNaN(parsed) ? Date.now() : parsed;
      })();

      setMatchUsers((prevUsers) =>
        sortUsersByActivity(prevUsers.map((user) => {
          if (String(user.matchId) !== String(matchId)) {
            return user;
          }

          return {
            ...user,
            hasChatted: true,
            activityAt: messageActivityAt,
            lastMessage: previewText,
            unread:
              !isSentByCurrentUser && !isCurrentChatOpen
                ? Number(user.unread || 0) + 1
                : user.unread,
          };
        }))
      );
    };

    const handleMessagesRead = ({ matchId, byUserId }) => {
      if (!matchId || !byUserId || String(byUserId) !== String(currentUserId)) {
        return;
      }

      setMatchUsers((prevUsers) =>
        prevUsers.map((user) =>
          String(user.matchId) === String(matchId)
            ? { ...user, unread: 0 }
            : user
        )
      );
    };

    const connectSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;

      socketService.on("message:new", handleMessageNew);
      socketService.on("messages:read", handleMessagesRead);
    };

    connectSocket();

    return () => {
      isMounted = false;
      socketService.off("message:new", handleMessageNew);
      socketService.off("messages:read", handleMessagesRead);
    };
  }, [currentScreen, currentUserId, selectedUser?.matchId]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCurrentScreen("chat");
  };

  const handleBackToList = (options = {}) => {
    const unmatchedMatchId = options?.unmatchedMatchId;
    if (unmatchedMatchId) {
      setMatchUsers((prevUsers) =>
        prevUsers.filter(
          (user) => String(user.matchId) !== String(unmatchedMatchId)
        )
      );
    }
    setCurrentScreen("list"); // This triggers the useEffect above to show tab bar again
    setSelectedUser(null);
  };

  return (
    <View style={styles.container}>

      {currentScreen === "list" ? (
        <ChatListScreen
          users={matchUsers}
          onSelectUser={handleSelectUser}
          isLoading={isLoadingMatches}
        />
      ) : (
        <ChatScreen matchedUser={selectedUser} onBack={handleBackToList} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
