// app/(tabs)/chat/conversation.js
//
// Route:     /(tabs)/chat/conversation
// Params:    matchId, userId, name, profileImage, isOnline
//
// This is the real chat screen. It reads matched-user data from route params,
// reconstructs the `matchedUser` object that ChatScreen expects, and handles
// the back navigation + unmatching entirely within the router.

import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import ChatScreen from "../../../components/chatScreen/ChatScreen";

export default function UsersChatScreen() {
  const router     = useRouter();
  const navigation = useNavigation();
  const params     = useLocalSearchParams();

  // ── Hide bottom tab bar while in conversation ─────────────────────────────

  useEffect(() => {
    // Walk up to the tab navigator and hide the tab bar
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: "none" },
    });

    return () => {
      // Restore tab bar when leaving
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          height: 80,
          backgroundColor: "#fff",
          paddingTop: 10,
          borderTopWidth: 1,
          borderColor: "#F1F5F9",
        },
      });
    };
  }, [navigation]);

  // ── Reconstruct matchedUser shape that ChatScreen expects ─────────────────

  const matchedUser = {
    matchId:      params.matchId,
    id:           params.userId,
    name:         params.name      ?? "Unknown",
    profileImage: params.profileImage || null,
    isOnline:     params.isOnline === "true",
    isSystem:     params.isSystem === "true",
    isVerified:   params.isVerified === "true",
    matchedDate:  params.matchedDate ? new Date(params.matchedDate) : null,
  };

  // ── Back handler — called by ChatScreen's back button ────────────────────
  // options.unmatchedMatchId is passed when the user unmatch from this screen

  const handleBack = (options = {}) => {
    router.back();

    // If user unmatched we pass the matchId back as a search param so the list
    // screen can remove the card when it re-focuses.
    if (options?.unmatchedMatchId) {
      router.setParams({ removedMatchId: options.unmatchedMatchId });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ChatScreen
        matchedUser={matchedUser}
        onBack={handleBack}
        initialSearchMode={params.searchMode === "true"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});