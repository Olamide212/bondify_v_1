import { Image } from "expo-image";
import { CheckCircle, Clock, Gift, Users, X, XCircle } from "lucide-react-native";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constant/colors";
import BaseModal from "./BaseModal";

const PRIMARY = colors.primary;
const PRIMARY_LIGHT = colors.primaryLight;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    color: "#22C55E",
    bg: "#F0FDF4",
    Icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "#FFFBEB",
    Icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "#EF4444",
    bg: "#FEF2F2",
    Icon: XCircle,
  },
};

// ─── Single referral row ──────────────────────────────────────────────────────
const ReferralItem = ({ item }) => {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.Icon;

  const initials = item.name
    ? item.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <View style={styles.itemRow}>
      {/* Avatar */}
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} cachePolicy="memory-disk" transition={150} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name || "Unknown User"}</Text>
        <Text style={styles.itemDate}>{item.date || "—"}</Text>
      </View>

      {/* Right side — status + reward */}
      <View style={styles.itemRight}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <StatusIcon size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
        {item.reward && item.status === "completed" && (
          <View style={styles.rewardRow}>
            <Gift size={11} color={PRIMARY} />
            <Text style={styles.rewardText}>{item.reward}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconWrap}>
      <Users size={36} color={PRIMARY} />
    </View>
    <Text style={styles.emptyTitle}>No referrals yet</Text>
    <Text style={styles.emptySubtitle}>
      Share your referral code with friends and your history will show up here.
    </Text>
  </View>
);

// ─── Summary bar ─────────────────────────────────────────────────────────────
const SummaryBar = ({ referrals }) => {
  const total = referrals.length;
  const completed = referrals.filter((r) => r.status === "completed").length;
  const pending = referrals.filter((r) => r.status === "pending").length;

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{total}</Text>
        <Text style={styles.summaryLabel}>Total</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
          {completed}
        </Text>
        <Text style={styles.summaryLabel}>Completed</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
          {pending}
        </Text>
        <Text style={styles.summaryLabel}>Pending</Text>
      </View>
    </View>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const ReferralHistoryModal = ({
  visible,
  onClose,
  // Pass your real referrals array from your API/service here.
  // Each item shape: { id, name, avatar?, date, status: "completed"|"pending"|"failed", reward? }
  referrals = [],
  isLoading = false,
}) => {
  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen>
      <SafeAreaView style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Referral History</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#111" />
          </Pressable>
        </View>

        {/* Summary */}
        {!isLoading && referrals.length > 0 && (
          <SummaryBar referrals={referrals} />
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loaderText}>Loading history...</Text>
          </View>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <ReferralItem item={item} />}
            ListEmptyComponent={<EmptyState />}
            contentContainerStyle={[
              styles.listContent,
              referrals.length === 0 && styles.listContentEmpty,
            ]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </BaseModal>
  );
};

export default ReferralHistoryModal;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#121212",
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  // Summary bar
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#121212",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#999",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 4,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginLeft: 72,
  },

  // Referral item
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 16,
    padding: 14,
    marginBottom: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: "OutfitBold",
    color: PRIMARY,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "OutfitSemiBold",
    color: '#E5E5E5',
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: "#999",
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "OutfitSemiBold",
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rewardText: {
    fontSize: 11,
    fontFamily: "OutfitMedium",
    color: PRIMARY,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "OutfitBold",
    color: '#E5E5E5',
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: "Outfit",
    color: "#999",
  },
});