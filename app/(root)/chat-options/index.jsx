/**
 * Chat Options Screen — app/(root)/chat-options/index.jsx
 *
 * Full-screen settings page opened when the user taps the ⋮ icon in the
 * chat header. Shows the matched user's photo + name, and a list of
 * options: Search chat, Export chat, Unmatch, Block, Report & Block — each
 * with an icon.
 */

import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    AlertTriangle,
    ArrowLeft,
    Ban,
    Download,
    HeartCrack,
    Search,
    User,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BlockReportModal from "../../../components/modals/Blockreportmodal";
import UnmatchReasonModal from "../../../components/modals/UnmatchReasonModal";
import { colors } from "../../../constant/colors";
import { useAlert } from "../../../context/AlertContext";
import { matchService } from "../../../services/matchService";
import { messageService } from "../../../services/messageService";

// ─── Option row component ─────────────────────────────────────────────────────
const OptionRow = ({ icon: Icon, iconColor = "#374151", label, labelColor, onPress, disabled }) => (
  <TouchableOpacity
    style={s.optionRow}
    activeOpacity={0.7}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[s.optionIconWrap, iconColor === "#EF4444" && s.optionIconDanger]}>
      <Icon size={20} color={iconColor} />
    </View>
    <Text style={[s.optionLabel, labelColor && { color: labelColor }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => <View style={s.divider} />;

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatOptionsScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const params  = useLocalSearchParams();

  const matchId      = params.matchId;
  const userId       = params.userId;
  const name         = params.name ?? "Unknown";
  const profileImage = params.profileImage || null;
  const isVerified   = params.isVerified === "true";

  const [isExporting, setIsExporting]   = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);

  // Modal visibility
  const [unmatchModal, setUnmatchModal] = useState(false);
  const [blockReportModal, setBlockReportModal] = useState({ visible: false, mode: "block" });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getFirstName = (fullName) => {
    const n = String(fullName || "").trim();
    return n ? n.split(/\s+/)[0] : "Unknown";
  };

  // ── Search chat ──────────────────────────────────────────────────────────
  const handleSearchChat = () => {
    router.back();
    // Slight delay to ensure back navigation completes, then set param
    // Use a unique timestamp so the effect re-fires on every tap
    setTimeout(() => {
      router.setParams({ searchMode: String(Date.now()) });
    }, 100);
  };

  // ── Export chat ──────────────────────────────────────────────────────────
  const handleExportChat = async () => {
    if (!matchId) return;
    setIsExporting(true);
    try {
      // Fetch all messages (no cursor, large limit)
      const res = await messageService.getMessages(matchId, { limit: 5000 });
      const msgs = res?.messages ?? res?.data?.messages ?? res ?? [];

      if (!Array.isArray(msgs) || msgs.length === 0) {
        showAlert({
          icon: 'info',
          title: 'Nothing to export',
          message: 'There are no messages in this conversation yet.',
          actions: [{ label: 'OK', style: 'primary' }],
        });
        return;
      }

      // Build plain-text transcript
      const lines = msgs.map((m) => {
        const senderName =
          m.sender?.firstName || m.sender?.name || (m.sender === userId ? name : "You");
        const time = m.createdAt
          ? new Date(m.createdAt).toLocaleString()
          : "";
        const content = m.content || (m.type === "image" ? "[Image]" : m.type === "voice" ? "[Voice note]" : "");
        return `[${time}] ${senderName}: ${content}`;
      });

      const transcript = `Chat with ${name}\nExported on ${new Date().toLocaleDateString()}\n${"─".repeat(40)}\n\n${lines.join("\n")}`;

      const fileUri = `${FileSystem.cacheDirectory}chat_${name.replace(/\s+/g, "_")}_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, transcript, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: `Chat with ${name}`,
        });
      } else {
        showAlert({
          icon: 'success',
          title: 'Exported',
          message: 'Chat saved but sharing is not available on this device.',
          actions: [{ label: 'OK', style: 'primary' }],
        });
      }
    } catch (err) {
      console.warn("Export chat error:", err);
      showAlert({
        icon: 'error',
        title: 'Export failed',
        message: err?.message || 'Could not export chat. Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Unmatch ──────────────────────────────────────────────────────────────
  const handleUnmatchConfirm = async ({ reason, details }) => {
    if (!matchId || isUnmatching) return;
    setIsUnmatching(true);
    try {
      await matchService.unmatch(matchId, { reason, details });
      setUnmatchModal(false);
      // Navigate all the way back to the chat list
      router.dismissAll();
    } catch (err) {
      showAlert({
        icon: 'error',
        title: 'Unable to unmatch',
        message: err?.message || 'Please try again.',
        actions: [{ label: 'OK', style: 'primary' }],
      });
    } finally {
      setIsUnmatching(false);
    }
  };

  // ── Block ────────────────────────────────────────────────────────────────
  const handleBlock = () => {
    setBlockReportModal({ visible: true, mode: "block" });
  };

  // ── Report & Block ───────────────────────────────────────────────────────
  const handleReportBlock = () => {
    setBlockReportModal({ visible: true, mode: "report" });
  };

  const handleBlockReportSuccess = (mode) => {
    setBlockReportModal({ visible: false, mode: "block" });
    if (mode === "block" || mode === "report") {
      router.dismissAll();
    }
  };

  // ────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chat Options</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── Profile card ── */}
        <View style={s.profileCard}>
          <View style={[s.avatar, s.avatarFallback]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={s.avatar} />
            ) : (
              <User size={32} color="#94A3B8" />
            )}
          </View>
          <Text style={s.profileName} className='capitalize' numberOfLines={1}>{getFirstName(name)}</Text>
          {isVerified && (
            <Text style={s.verifiedTag}>✓ Verified</Text>
          )}
        </View>

        <Divider />

        {/* ── General options ── */}
        <Text style={s.sectionLabel}>General options</Text>

        <OptionRow
          icon={Search}
          label="Search in conversation"
          onPress={handleSearchChat}
        />

        <OptionRow
          icon={Download}
          label={isExporting ? "Exporting..." : "Export chat"}
          onPress={handleExportChat}
          disabled={isExporting}
        />

        {isExporting && (
          <View style={s.exportingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={s.exportingText}>Preparing your chat export…</Text>
          </View>
        )}

        <Divider />

        {/* ── Danger options ── */}
        <Text style={s.sectionLabel}>Privacy options</Text>

        <OptionRow
          icon={HeartCrack}
          iconColor="#EF4444"
          label="Unmatch"
          labelColor="#EF4444"
          onPress={() => setUnmatchModal(true)}
        />

        <OptionRow
          icon={Ban}
          iconColor="#EF4444"
          label="Block"
          labelColor="#EF4444"
          onPress={handleBlock}
        />

        <OptionRow
          icon={AlertTriangle}
          iconColor="#EF4444"
          label="Report & Block"
          labelColor="#EF4444"
          onPress={handleReportBlock}
        />
      </ScrollView>

      {/* ── Unmatch reason modal ── */}
      <UnmatchReasonModal
        visible={unmatchModal}
        name={getFirstName(name)}
        loading={isUnmatching}
        onClose={() => !isUnmatching && setUnmatchModal(false)}
        onConfirm={handleUnmatchConfirm}
      />

      {/* ── Block / Report modal ── */}
      <BlockReportModal
        visible={blockReportModal.visible}
        mode={blockReportModal.mode}
        profile={{
          _id: userId,
          name,
          images: profileImage ? [profileImage] : [],
        }}
        onClose={() => setBlockReportModal((prev) => ({ ...prev, visible: false }))}
        onSuccess={handleBlockReportSuccess}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },

  content: { paddingBottom: 40 },

  // Profile card
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  profileName: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
    textTransform: "capitalize",
    color: "#111",
    marginTop: 12,
  },
  verifiedTag: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#1D9BF0",
    marginTop: 4,
  },

  // Sections
  sectionLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansSemiBold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },

  // Option rows
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionIconDanger: {
    backgroundColor: "#FEF2F2",
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansMedium",
    color: "#1F2937",
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginVertical: 8,
  },

  // Exporting indicator
  exportingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  exportingText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#6B7280",
  },
});
