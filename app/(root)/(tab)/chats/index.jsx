// App.js
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import ChatScreen from "../../../../components/chatScreen/ChatScreen";
import { matchService } from "../../../../services/matchService";
import { socketService } from "../../../../services/socketService";


export default function Chat() {
  const [currentScreen, setCurrentScreen] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);
  const [matchUsers, setMatchUsers] = useState([]);
  const currentUserId = useSelector(
    (state) => state.auth.user?.id || state.auth.user?._id
  );

  useEffect(() => {
    let isMounted = true;

    const normalizeMatches = (matches) =>
      matches.map((match) => {
        const images = Array.isArray(match.user?.images)
          ? match.user.images
              .map((image) =>
                typeof image === "string" ? image : image?.url
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
            match.user?.name ||
            [match.user?.firstName, match.user?.lastName].filter(Boolean).join(" ") ||
            "Unknown",
          profileImage,
          isOnline: match.user?.online ?? false,
          matchedDate: match.matchedAt
            ? new Date(match.matchedAt)
            : new Date(),
          lastMessage: latestMessage || (hasChatted ? "Tap to continue chatting" : "No messages yet"),
          unread: Number(match.unread || 0),
          hasChatted,
        };
      });

    const loadMatches = async () => {
      try {
        const matches = await matchService.getMatches();
        if (isMounted) {
          setMatchUsers(matches.length > 0 ? normalizeMatches(matches) : []);
        }
      } catch (_error) {
        if (isMounted) {
          setMatchUsers([]);
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

      setMatchUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (String(user.matchId) !== String(matchId)) {
            return user;
          }

          return {
            ...user,
            hasChatted: true,
            lastMessage: previewText,
            unread:
              !isSentByCurrentUser && !isCurrentChatOpen
                ? Number(user.unread || 0) + 1
                : user.unread,
          };
        })
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

  const handleBackToList = () => {
    setCurrentScreen("list");
    setSelectedUser(null);
  };

  return (


      <View style={styles.container}>
    
        {currentScreen === "list" ? (
          <ChatListScreen users={matchUsers} onSelectUser={handleSelectUser} />
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
