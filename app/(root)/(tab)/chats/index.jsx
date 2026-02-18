// App.js
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import ChatScreen from "../../../../components/chatScreen/ChatScreen";
import { matchedUsers } from "../../../../data/mockData";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { matchService } from "../../../../services/matchService";

export default function Chat() {
  const [currentScreen, setCurrentScreen] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);
  const [matchUsers, setMatchUsers] = useState(matchedUsers);

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

        return {
          id: match.user?._id ?? match.user?.id,
          matchId: match.matchId ?? match.id,
          name: match.user?.name ?? "Unknown",
          profileImage,
          isOnline: match.user?.online ?? false,
          matchedDate: match.matchedAt
            ? new Date(match.matchedAt)
            : new Date(),
          lastMessage: hasChatted
            ? "Tap to continue chatting"
            : "Start the conversation",
          unread: 0,
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
          setMatchUsers(matchedUsers);
        }
      }
    };

    loadMatches();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCurrentScreen("chat");
  };

  const handleBackToList = () => {
    setCurrentScreen("list");
    setSelectedUser(null);
  };

  return (
    <SafeAreaProvider>

      <View style={styles.container}>
    
        {currentScreen === "list" ? (
          <ChatListScreen users={matchUsers} onSelectUser={handleSelectUser} />
        ) : (
          <ChatScreen matchedUser={selectedUser} onBack={handleBackToList} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
