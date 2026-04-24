import { Badge, Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useSelector } from "react-redux";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";
import { images } from "../../constant/images";

export default function TabsLayout() {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newLikes, setNewLikes] = useState(0);
  const selectedContentColor = colors.white;
  const defaultContentColor = "#82848a";
  const activeIndicatorColor = Platform.OS === "android" ? colors.primary : undefined;

  const currentUserId = useSelector(
    (state) => state.auth?.user?.id || state.auth?.user?._id
  );

  useEffect(() => {
    const initializeBadges = async () => {
      try {
        const { matchService } = require("../../services/matchService");
        const matches = await matchService.getCachedMatches();
        const unreadCount = matches.reduce(
          (sum, match) => sum + (match.unread || 0),
          0
        );
        setUnreadMessages(unreadCount);

        const { profileService } = require("../../services/profileService");
        const likedYou = await profileService.getLikedYou().catch(() => []);
        setNewLikes(likedYou.length);
      } catch (err) {
        console.warn("Failed to initialize badge counts:", err);
      }
    };

    initializeBadges();

    const { socketService } = require("../../services/socketService");

    socketService.on("message:new", (data) => {
      const senderId =
        data?.message?.sender?._id ||
        data?.message?.sender?.id ||
        data?.message?.sender;
      const isSentByMe =
        senderId && currentUserId
          ? String(senderId) === String(currentUserId)
          : false;

      if (!isSentByMe) {
        setUnreadMessages((prev) => prev + 1);
      }
    });

    socketService.on("match:new", () => {
      setNewLikes((prev) => prev + 1);
    });

    return () => {
      socketService.off("message:new");
      socketService.off("match:new");
    };
  }, [currentUserId]);

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <StatusBar style="light" />

      <NativeTabs
        backgroundColor="#121212"
        iconColor={defaultContentColor}
        tintColor={selectedContentColor}
        labelVisibilityMode={Platform.OS === "android" ? "labeled" : undefined}
        indicatorColor={activeIndicatorColor}
        labelStyle={{ color: defaultContentColor, fontWeight: "500" }}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger name="home">
          <Icon src={images.bondifyIcon} selectedColor={selectedContentColor} />
          <Label selectedStyle={{ color: selectedContentColor, fontWeight: "700" }}>Home</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="matches">
          <Icon src={Icons.heart} selectedColor={selectedContentColor} />
          <Label selectedStyle={{ color: selectedContentColor, fontWeight: "700" }}>Likes</Label>
          {newLikes > 0 ? <Badge>{newLikes > 99 ? "99+" : newLikes}</Badge> : null}
        </NativeTabs.Trigger>


        <NativeTabs.Trigger name="feed">
          <Icon src={Icons.feedIcon} selectedColor={selectedContentColor} />
          <Label selectedStyle={{ color: selectedContentColor, fontWeight: "700" }}>BondUp</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="chats">
          <Icon src={Icons.message} selectedColor={selectedContentColor} />
          <Label selectedStyle={{ color: selectedContentColor, fontWeight: "700" }}>Chat</Label>
          {unreadMessages > 0 ? (
            <Badge>{unreadMessages > 99 ? "99+" : unreadMessages}</Badge>
          ) : null}
        </NativeTabs.Trigger>


        <NativeTabs.Trigger name="profile">
          <Icon src={Icons.people} selectedColor={selectedContentColor} />
          <Label selectedStyle={{ color: selectedContentColor, fontWeight: "700" }}>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}
