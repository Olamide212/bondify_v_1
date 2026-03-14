// components/Header.js
import { ArrowLeft, BadgeCheck, MoreVertical, User } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";
import { fonts } from "../../constant/fonts";

const ChatHeader = ({ matchedUser, onBack, onOpenProfile, onOpenActions }) => {
  const [isImageLoading, setIsImageLoading] = React.useState(Boolean(matchedUser?.profileImage));
  const [imageFailed, setImageFailed] = React.useState(!matchedUser?.profileImage);
  const lastProfileTapAtRef = React.useRef(0);

  if (!matchedUser) return null;

  const getFirstName = (fullName) => {
    const normalized = String(fullName || "").trim();
    if (!normalized) return "Unknown";
    return normalized.split(/\s+/)[0];
  };

  const handleOpenProfile = () => {
    const now = Date.now();
    if (now - lastProfileTapAtRef.current < 500) {
      return;
    }

    lastProfileTapAtRef.current = now;
    onOpenProfile?.();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
        <ArrowLeft color="#000" size={28} />
      </TouchableOpacity>
      <View style={styles.profileTapArea}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenProfile}>
        <View style={styles.profileContainer}>
          <View style={[styles.chatProfileImage, styles.avatarFallback]}>
            {!imageFailed && matchedUser.profileImage ? (
              <Image
                source={{ uri: matchedUser.profileImage }}
                style={styles.chatProfileImage}
                onLoadStart={() => {
                  setIsImageLoading(true);
                  setImageFailed(false);
                }}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageFailed(true);
                }}
              />
            ) : (
              <User size={16} color="#94A3B8" />
            )}

            {isImageLoading && (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
          {matchedUser.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} className='capitalize'>{getFirstName(matchedUser.name)}</Text>
            {matchedUser.isSystem && (
              <BadgeCheck size={18} color="#1D9BF0" style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.statusContainer}>
            {matchedUser.isOnline && !matchedUser.isSystem && (
              <>
                <Text style={styles.onlineText} className='uppercase text-primary'>Active Now</Text>
              </>
            )}
            {matchedUser.isSystem && (
              <Text style={styles.systemText}>Bondify Team</Text>
            )}
          </View>
        </View>
      </View>
      {!matchedUser.isSystem && onOpenActions && (
        <View className="flex-row">
          <TouchableOpacity onPress={onOpenActions}>
            <MoreVertical color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  profileContainer: {
    position: "relative",
    marginRight: 12,
    marginLeft: 12
  },
  profileTapArea: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
fontFamily: fonts.PlusJakartaSansMedium,
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
  systemText: {
    color: "#1D9BF0",
    fontSize: 12,
    fontFamily: fonts.PlusJakartaSansMedium,
  },
});

export default ChatHeader;
