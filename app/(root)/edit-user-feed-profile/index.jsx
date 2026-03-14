import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { colors } from "../../../constant/colors";
import feedService from "../../../services/feedService";
import apiClient from "../../../utils/axiosInstance";

const BRAND = colors.primary;

const avatarUrl = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

const fallbackDisplayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  "User";

export default function EditFeedProfileScreen() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [displayNameInput, setDisplayNameInput] = useState(() => fallbackDisplayName(currentUser));
  const [userNameInput, setUserNameInput] = useState(currentUser?.userName ?? "");
  const [localAvatarUri, setLocalAvatarUri] = useState(() => avatarUrl(currentUser));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await feedService.getSocialProfile();
        const profile = res?.data ?? res;
        if (!mounted) return;
        setDisplayNameInput(profile?.displayName ?? fallbackDisplayName(currentUser));
        setUserNameInput(profile?.userName ?? currentUser?.userName ?? "");
        setLocalAvatarUri(profile?.profilePhoto ?? avatarUrl(currentUser));
      } catch {
        if (!mounted) return;
        setDisplayNameInput(fallbackDisplayName(currentUser));
        setUserNameInput(currentUser?.userName ?? "");
        setLocalAvatarUri(avatarUrl(currentUser));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const fileName = uri.split("/").pop() || "photo.jpg";
    const mimeType = asset.mimeType || "image/jpeg";

    setLocalAvatarUri(uri);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePhoto", { uri, name: fileName, type: mimeType });

      const res = await apiClient.post("/feed/social-profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        res?.data?.data?.profilePhoto ??
        res?.data?.data?.user?.profilePhoto ??
        res?.data?.profilePhoto ??
        uri;

      setLocalAvatarUri(uploadedUrl);
    } catch (error) {
      setLocalAvatarUri(avatarUrl(currentUser));
      Alert.alert("Error", error?.response?.data?.message ?? "Could not update photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedDisplayName = displayNameInput.trim();
    const trimmedUserName = userNameInput.trim();

    if (!trimmedDisplayName) {
      Alert.alert("Required", "Display name cannot be empty.");
      return;
    }
    if (!trimmedUserName) {
      Alert.alert("Required", "Username cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      await feedService.updateSocialProfile({
        displayName: trimmedDisplayName,
        userName: trimmedUserName,
      });
      Alert.alert("Saved", "Feed profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message ?? "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={BRAND} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Feed Profile</Text>
       <View />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploading}>
            {localAvatarUri ? (
              <Image source={{ uri: localAvatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {displayNameInput?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.avatarOverlayText}>Change Photo</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          {/* <Text style={styles.label}>Display Name</Text>
          <TextInput
            value={displayNameInput}
            onChangeText={setDisplayNameInput}
            style={styles.input}
            placeholder="Enter display name"
            placeholderTextColor="#9CA3AF"
            maxLength={40}
          /> */}

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={userNameInput}
            onChangeText={setUserNameInput}
            style={styles.input}
            placeholder="@username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          <TouchableOpacity
            style={[styles.primaryButton, saving && { opacity: 0.6 }]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  saveIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(17,17,17,0.04)",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarFallback: {
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 42,
    color: "#fff",
    fontFamily: "PlusJakartaSansBold",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: -10,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 4,
  },
  avatarOverlayText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: BRAND,
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#6B7280",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "PlusJakartaSans",
    color: "#111",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
});
