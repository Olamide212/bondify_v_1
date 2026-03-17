/**
 * Bondup Screen  —  app/(root)/(tab)/feed/index.jsx
 *
 * Modern day-based feed:
 *  • Horizontal scrollable day chips (Yesterday, Today, Tomorrow, …)
 *  • Plans grouped into "I'm Free" & "Join Me" sections under each day
 *  • FAB → CreateBondupModal
 *  • Clickable cards → PlanDetailModal
 *  • Real-time socket updates
 */

import { useRouter } from "expo-router";
import { CalendarHeart, Sparkles, User } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
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

// ─── Day helpers ────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Build an array of 7 day objects starting from yesterday.
 * Each has: { key: "Mon", label: "Today" | "Tomorrow" | "Wednesday" etc., date }
 */
function buildDayChips() {
  const chips = [];
  const now = new Date();

  for (let offset = -1; offset <= 5; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayKey = DAY_NAMES[d.getDay()];

    let label;
    if (offset === -1) label = "Yesterday";
    else if (offset === 0) label = "Today";
    else if (offset === 1) label = "Tomorrow";
    else label = FULL_DAY_NAMES[d.getDay()];

    chips.push({ key: dayKey, label, offset, date: d });
  }
  return chips;
}

// ─── avatar helper ──────────────────────────────────────────────────────────
const avatar = (user) =>
  user?.profilePhoto || user?.images?.[0]?.url || user?.images?.[0] || null;

// ─── Bondup Screen ──────────────────────────────────────────────────────────
export default function BondupScreen() {
  const router = useRouter();
  const { user: currentUser } = useSelector((s) => s.auth);

  const dayChips = useMemo(() => buildDayChips(), []);
  const [selectedDay, setSelectedDay] = useState(1); // index => "Today"
  const dayScrollRef = useRef(null);

  // ── Plans state ─────────────────────────────────────────────────────────────
  const [allPlans, setAllPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansRefreshing, setPlansRefreshing] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  // ── Load all active plans (both statuses) ───────────────────────────────────
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const [freeRes, joinRes] = await Promise.all([
        planService.getPlans({ status: "free" }),
        planService.getPlans({ status: "join_me" }),
      ]);
      const combined = [
        ...(freeRes.data ?? []),
        ...(joinRes.data ?? []),
      ];
      // Deduplicate
      const unique = combined.filter(
        (p, i, arr) => arr.findIndex((x) => x._id === p._id) === i
      );
      setAllPlans(unique);
    } catch {
      // silent
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const onRefresh = async () => {
    setPlansRefreshing(true);
    await loadPlans();
    setPlansRefreshing(false);
  };

  // ── Filter by selected day ──────────────────────────────────────────────────
  const selectedDayKey = dayChips[selectedDay]?.key;

  const freePlans = useMemo(
    () =>
      allPlans.filter(
        (p) =>
          p.status === "free" &&
          (p.days?.includes(selectedDayKey) || (!p.days?.length && selectedDay <= 1))
      ),
    [allPlans, selectedDayKey, selectedDay]
  );

  const joinMePlans = useMemo(
    () =>
      allPlans.filter(
        (p) =>
          p.status === "join_me" &&
          (p.days?.includes(selectedDayKey) || (!p.days?.length && selectedDay <= 1))
      ),
    [allPlans, selectedDayKey, selectedDay]
  );

  const hasPlans = freePlans.length > 0 || joinMePlans.length > 0;

  // ── Plans actions ───────────────────────────────────────────────────────────
  const handleJoinPlan = async (planId) => {
    setAllPlans((prev) =>
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
        setAllPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
        setDetailPlan((d) => (d?._id === planId ? res.data : d));
      }
    } catch {
      loadPlans();
    }
  };

  const handleLeavePlan = async (planId) => {
    setAllPlans((prev) =>
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
        setAllPlans((prev) => prev.map((p) => (p._id === planId ? res.data : p)));
        setDetailPlan((d) => (d?._id === planId ? res.data : d));
      }
    } catch {
      loadPlans();
    }
  };

  const handleDeletePlan = (planId) => {
    Alert.alert("Remove Bondup", "Are you sure you want to remove this bondup?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setAllPlans((prev) => prev.filter((p) => p._id !== planId));
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
    setAllPlans((prev) => {
      if (prev.some((p) => p._id === newPlan._id)) return prev;
      return [newPlan, ...prev];
    });
  };

  const handlePlanPress = (plan) => {
    setDetailPlan(plan);
  };

  const handleStartChat = async (plan) => {
    if (plan.participants?.length < 1) {
      Alert.alert(
        "Group Chat",
        "Wait for others to join your bondup first!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const res = await planChatService.startGroupChat(plan._id);
      if (res.success && res.data?._id) {
        const chatId = res.data._id;
        setAllPlans((prev) =>
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
    const handleNewPlan = (plan) => {
      setAllPlans((prev) => {
        if (prev.some((p) => p._id === plan._id)) return prev;
        return [plan, ...prev];
      });
    };
    const handleUpdatedPlan = (plan) => {
      setAllPlans((prev) => prev.map((p) => (p._id === plan._id ? plan : p)));
      setDetailPlan((d) => (d?._id === plan._id ? plan : d));
    };
    const handleRemovedPlan = ({ planId }) => {
      setAllPlans((prev) => prev.filter((p) => p._id !== planId));
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
  }, []);

  // ── Day chip press ──────────────────────────────────────────────────────────
  const handleDayPress = (index) => {
    setSelectedDay(index);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const userAvatar = avatar(currentUser);

  const renderSection = (title, emoji, plans) => {
    if (plans.length === 0) return null;
    return (
      <View style={fStyles.section}>
        <View style={fStyles.sectionHeader}>
          <Text style={fStyles.sectionEmoji}>{emoji}</Text>
          <Text style={fStyles.sectionTitle}>{title}</Text>
          <View style={fStyles.sectionCount}>
            <Text style={fStyles.sectionCountText}>{plans.length}</Text>
          </View>
        </View>
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            currentUserId={currentUser?._id}
            onJoin={handleJoinPlan}
            onLeave={handleLeavePlan}
            onDelete={handleDeletePlan}
            onPress={handlePlanPress}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={fStyles.container} edges={["top"]}>
        {/* Header */}
        <View style={fStyles.header}>
          <View style={fStyles.headerLeft}>
            <View style={fStyles.logoContainer}>
              <Sparkles size={20} color={colors.tertiary} />
              <Text style={fStyles.logoText}>Bondup</Text>
            </View>
          </View>
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

        {/* Subtitle */}
        <View style={fStyles.subtitleContainer}>
          <Text style={fStyles.subtitle}>
            Meetups happening soon \u2014 pick a day \u2728
          </Text>
        </View>

        {/* Horizontal day scroller */}
        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={fStyles.dayScroller}
        >
          {dayChips.map((chip, i) => {
            const isActive = i === selectedDay;
            return (
              <TouchableOpacity
                key={chip.key + chip.offset}
                style={[
                  fStyles.dayChip,
                  isActive && fStyles.dayChipActive,
                ]}
                onPress={() => handleDayPress(i)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    fStyles.dayChipLabel,
                    isActive && fStyles.dayChipLabelActive,
                  ]}
                >
                  {chip.label}
                </Text>
                <Text
                  style={[
                    fStyles.dayChipSub,
                    isActive && fStyles.dayChipSubActive,
                  ]}
                >
                  {chip.key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Feed */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={plansRefreshing}
              onRefresh={onRefresh}
              colors={[BRAND]}
              tintColor={BRAND}
            />
          }
        >
          {plansLoading && allPlans.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={BRAND}
              style={{ marginTop: 60 }}
            />
          ) : !hasPlans ? (
            <View style={fStyles.emptyState}>
              <Text style={fStyles.emptyEmoji}>{String.fromCodePoint(0x1F91D)}</Text>
              <Text style={fStyles.emptyTitle}>
                No bondups for {dayChips[selectedDay]?.label}
              </Text>
              <Text style={fStyles.emptySub}>
                Be the first to share what you're up to!
              </Text>
              <TouchableOpacity
                style={fStyles.emptyBtn}
                onPress={() => setShowCreatePlan(true)}
              >
                <Sparkles size={16} color="#fff" />
                <Text style={fStyles.emptyBtnText}>Create a Bondup</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderSection("I\u2019m Free", "\ud83d\ude4c", freePlans)}
              {renderSection("Join Me", "\ud83c\udf89", joinMePlans)}
            </>
          )}

          {plansLoading && allPlans.length > 0 && (
            <ActivityIndicator
              size="small"
              color={BRAND}
              style={{ marginVertical: 16 }}
            />
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={fStyles.fab}
          onPress={() => setShowCreatePlan(true)}
        >
          <CalendarHeart size={24} color="#fff" />
        </TouchableOpacity>

        {/* Modals */}
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const fStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoText: {
    fontSize: 24,
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
    letterSpacing: -0.5,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#dadada",
  },
  headerAvatarFallback: {
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Subtitle */
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansMedium",
    color: "#888",
  },

  /* Day Scroller */
  dayScroller: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    minWidth: 72,
  },
  dayChipActive: {
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayChipLabel: {
    fontSize: 13,
    fontFamily: "PlusJakartaSansBold",
    color: "#555",
  },
  dayChipLabelActive: {
    color: "#fff",
  },
  dayChipSub: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansMedium",
    color: "#999",
    marginTop: 2,
  },
  dayChipSubActive: {
    color: "rgba(255,255,255,0.7)",
  },

  /* Sections */
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
  },
  sectionCount: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    color: BRAND,
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSansBold",
    color: "#111",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "PlusJakartaSansBold",
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
