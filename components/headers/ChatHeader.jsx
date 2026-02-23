// components/Header.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft, MoreVertical, Circle, Video } from "lucide-react-native";
import { formatRelativeDate } from "../../utils/helper";
import {colors} from "../../constant/colors"
import { fonts } from "../../constant/fonts";

const ChatHeader = ({ matchedUser, onBack }) => {
  if (!matchedUser) return null;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <ArrowLeft color="#000" size={24} />
      </TouchableOpacity>
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: matchedUser.profileImage }}
          style={styles.chatProfileImage}
        />
        {matchedUser.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{matchedUser.name}</Text>
        <View style={styles.statusContainer}>
          {matchedUser.isOnline && (
            <>
             
              <Text style={styles.onlineText} className='uppercase text-primary'>Active Now</Text>
            </>
          )}
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity>
          <Video color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <MoreVertical color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  profileContainer: {
    position: "relative",
    marginRight: 12,
    marginLeft: 12
  },
  chatProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
fontFamily: fonts.SantoshiMedium,
    color: "#1F2937",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  offlineText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});

export default ChatHeader;
