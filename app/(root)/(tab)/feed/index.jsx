/**
 * BonFeed Screen  —  app/(root)/(tab)/feed/index.jsx
 *
 * Plans-only feed with two tabs:
 *  • "I'm Free"  — plans with status === 'free'
 *  • "Join Me"   — plans with status === 'join_me'
 *  • Create-plan FAB → CreatePlanModal
 *  • Clickable plans → PlanDetailModal
 *  • Real-time socket updates
 */

import { useRouter } from "expo-router";
import { CalendarHeart, User } from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import CreatePlanModal from "../../../../components/feed/CreatePlanModal";
import PlanCard from "../../../../components/feed/PlanCard";
import PlanDetailModal from "../../../../components/feed/PlanDetailModal";
import { colors } from "../../../../constant/colors";
import { images } from "../../../../constant/images";
import planChatService from "../../../../services/planChatService";
import planService from "../../../../services/planService";
import { socketService } from "../../../../services/socketService";

const BRAND = colors.primary;
const TABS = ["I\u2019m Free", "Join Me"];
const TAB_STATUS = ["free", "join_me"];

// ─── helpers ──────────────────────────────────────────────────────────────────
const avatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

// ─── BonFeed Screen ─────────────────────────────────────────────────────────────
export default function BonFeed() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState(0);

  // ── Plans state ─────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansRefreshing, setPlansRefreshing] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  // ── Load plans (filtered by active tab status) ──────────────────────────────
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await planService.getPlans({ status: TAB_STATUS[activeTab] });
      setPlans(res.data ?? []);
    } catch {
      // silent
    } finally {
      setPlansLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const onRefresh = async () => {
    setPlansRefreshing(true);
    await loadPlans();
    setPlansRefreshing(false);
  };

  // ── Plans actions ───────────────────────────────────────────────────────────
  const handleJoinPlan = async (planId) => {
    setPlans((prev) =>
      prev.map((p) =>
        p._id === planId
          ? { ...p, hasJoined: true, participants: [...(p.participants || []), { user: currentUser }] }
          : p
      )
    );
    setDetailPlan((d) =>
      d?._id === planId
        ? { ...d, hasJoined: true, participants: [...(d.participants || []), { user: currentUser }] }
        : d
    );
    try {
      const res = await planService.joinPlan(planId);
      if (res.success) {
        setPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
        setDetailPlan((d) => (d?._id === planId ? res.data : d));
      }
    } catch {
      loadPlans();
    }
  };

  const handleLeavePlan = async (planId) => {
    setPlans((prev) =>
      prev.map((p) =>
        p._id === planId
          ? {
              ...p,
              hasJoined: false,
              participants: (p.participants || []).filter(
                (pt) => String(pt.user?._id || pt.user) !== String(currentUser?._id)
              ),
            }
          : p
      )
    );
    setDetailPlan((d) =>
      d?._id === planId
        ? {
            ...d,
            hasJoined: false,
            participants: (d.participants || []).filter(
              (pt) => String(pt.user?._id || pt.user) !== String(currentUser?._id)
            ),
          }
        : d
    );
    try {
      const res = await planService.leavePlan(planId);
      if (res.success) {
        setPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
        setDetailPlan((d) => (d?._id === planId ? res.data : d));
      }
    } catch {
      loadPlans();
    }
  };

  const handleDeletePlan = (planId) => {
    Alert.alert("Remove Plan", "Are you sure you want to remove this plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setPlans((prev) => prev.filter((p) => p._id !== planId));
          setDetailPlan((d) => (d?._id === planId ? null : d));
          try {
            await planService.deletePlan(planId);
          } catch {
            // silent
          }
        },
      },
    ]);
  };

  const handlePlanCreated = (newPlan) => {
    // Only add to current list if the plan status matches the active tab
    if (newPlan.status === TAB_STATUS[activeTab]) {
      setPlans((prev) => [newPlan, ...prev]);
    }
  };

  const handlePlanPress = (plan) => {
    setDetailPlan(plan);
  };

  const handleStartChat = async (plan) => {
    if (plan.participants?.length < 1) {
      Alert.alert(
        "Group Chat",
        "Wait for others to join your plan first!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Start (or get existing) group chat
      const res = await planChatService.startGroupChat(plan._id);
      if (res.success && res.data?._id) {
        const chatId = res.data._id;
        // Update local plan with groupChatId
        setPlans((prev) =>
          prev.map((p) =>
            p._id === plan._id ? { ...p, groupChatId: chatId } : p
          )
        );
        setDetailPlan(null);
        router.push({
          pathname: "/chat-screen",
          params: {
            matchId: chatId,
            name: plan.activity || (plan.status === "free" ? "I\u2019m Free" : "Join Me"),
            isGroupChat: "true",
            planId: plan._id,
          },
        });
      }
    } catch {
      Alert.alert("Error", "Could not start group chat. Try again.", [{ text: "OK" }]);
    }
  };

  // ── Socket: real-time plan updates ──────────────────────────────────────────
  useEffect(() => {
    const currentStatus = TAB_STATUS[activeTab];

    const handleNewPlan = (plan) => {
      if (plan.status !== currentStatus) return;
      setPlans((prev) => {
        if (prev.some((p) => p._id === plan._id)) return prev;
        return [plan, ...prev];
      });
    };
    const handleUpdatedPlan = (plan) => {
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? plan : p)));
      setDetailPlan((d) => (d?._id === plan._id ? plan : d));
    };
    const handleRemovedPlan = ({ planId }) => {
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      setDetailPlan((d) => (d?._id === planId ? null : d));
    };

    socketService.on("plans:new", handleNewPlan);
    socketService.on("plans:updated", handleUpdatedPlan);
    socketService.on("plans:removed", handleRemovedPlan);

    return () => {
      socketService.off("plans:new", handleNewPlan);
      socketService.off("plans:updated", handleUpdatedPlan);
      socketService.off("plans:removed", handleRemovedPlan);
    };
  }, [activeTab]);

  // ── Tab press ───────────────────────────────────────────────────────────────
  const handleTabPress = (i) => {
    if (i !== activeTab) {
      setActiveTab(i);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const userAvatar = avatar(currentUser);
  const emptyLabel = activeTab === 0 ? "free" : "looking for company";

  return (
    <SafeAreaProvider>
    <SafeAreaView style={fStyles.container} edges={["top"]}>
      {/* Header */}
      <View style={fStyles.header}>
        <Image source={images.bonFeed} style={{width: 120, height: 40}} resizeMode="cover" />
       
        <TouchableOpacity onPress={() => router.push("/feed-profile")}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={fStyles.headerAvatar} />
          ) : (
            <View style={[fStyles.headerAvatar, fStyles.headerAvatarFallback]}>
              <User size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={fStyles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={t}
            style={[
              fStyles.tabItem,
              activeTab === i && fStyles.tabItemActive,
            ]}
            onPress={() => handleTabPress(i)}
          >
            <Text
              style={[
                fStyles.tabLabel,
                activeTab === i ? fStyles.tabLabelActive : fStyles.tabLabelInactive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Plans Feed ───────────────────────────────────────────────────── */}
      <FlatList
        data={plans}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            currentUserId={currentUser?._id}
            onJoin={handleJoinPlan}
            onLeave={handleLeavePlan}
            onDelete={handleDeletePlan}
            onPress={handlePlanPress}
          />
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={plansRefreshing}
            onRefresh={onRefresh}
            colors={[BRAND]}
            tintColor={BRAND}
          />
        }
        ListFooterComponent={
          plansLoading && plans.length > 0 ? (
            <ActivityIndicator size="small" color={BRAND} style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !plansLoading ? (
            <View style={fStyles.emptyState}>
              <Text style={fStyles.emptyEmoji}>📅</Text>
              <Text style={fStyles.emptyTitle}>No plans yet</Text>
              <Text style={fStyles.emptySub}>
                Be the first to let people know you&apos;re {emptyLabel}!
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={BRAND} style={{ marginTop: 60 }} />
          )
        }
      />

      {/* Create Plan FAB */}
      <TouchableOpacity
        style={fStyles.fab}
        onPress={() => setShowCreatePlan(true)}
      >
        <CalendarHeart size={24} color="#fff" />
      </TouchableOpacity>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreatePlanModal
        visible={showCreatePlan}
        onClose={() => setShowCreatePlan(false)}
        onCreated={handlePlanCreated}
      />

      <PlanDetailModal
        visible={!!detailPlan}
        plan={detailPlan}
        currentUserId={currentUser?._id}
        onClose={() => setDetailPlan(null)}
        onJoin={handleJoinPlan}
        onLeave={handleLeavePlan}
        onDelete={handleDeletePlan}
        onStartChat={handleStartChat}
      />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const fStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",

  },
  headerAvatar: { width: 40, height: 40, borderRadius: 40, borderWidth: 1, borderColor: '#dadada' },
  headerAvatarFallback: {
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },

  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#111",
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: "PlusJakartaSansBold",
  },
  tabLabelActive: {
    color: "#111",
  },
  tabLabelInactive: {
    color: "#9CA3AF",
  },

  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
