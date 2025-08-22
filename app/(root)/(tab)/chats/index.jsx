// App.js
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import ChatListScreen from "../../../../components/chatScreen/ChatListScreen";
import ChatScreen from "../../../../components/chatScreen/ChatScreen";
import { matchedUsers } from "../../../../data/mockData";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


import { colors } from "../../../../constant/colors";
import { StatusBar } from "expo-status-bar";

export default function Chat() {
  const [currentScreen, setCurrentScreen] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);

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
          <ChatListScreen
            users={matchedUsers}
            onSelectUser={handleSelectUser}
          />
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
