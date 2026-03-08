import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import BaseModal from "../modals/BaseModal";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";
import AIService from "../../services/aiService";

// ─── Fallback suggestions (used if API fails or no matchId) ───
const FALLBACK_SUGGESTIONS = [
  "Hey there! 😊 What's one thing that's made you smile recently?",
  "If you could travel anywhere tomorrow, where would you go and why?",
  "What's the best meal you've ever had? I need to know! 🍕",
  "Are you more of a morning person or a night owl?",
  "What's something you're really passionate about that most people don't know?",
];

const getRandomIndex = (excludeIdx, arrLength) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * arrLength);
  } while (arrLength > 1 && idx === excludeIdx);
  return idx;
};

const RizzModal = ({ visible, onClose, onSend, matchId }) => {
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // ── Fetch AI icebreakers whenever the modal opens ─────────────
  useEffect(() => {
    if (!visible) return;

    // Reset to a random fallback immediately so there's always something to show
    setCurrentIdx(getRandomIndex(-1, FALLBACK_SUGGESTIONS.length));
    setSuggestions(FALLBACK_SUGGESTIONS);
    setError(null);

    if (!matchId) return; // no matchId → keep fallbacks, don't hit API

    const fetchIcebreakers = async () => {
      setLoading(true);
      try {
        const response = await AIService.getIcebreakerSuggestions(matchId);
        const fetched  = response?.data?.suggestions;

        if (Array.isArray(fetched) && fetched.length > 0) {
          setSuggestions(fetched);
          setCurrentIdx(0); // start at first AI suggestion
        }
      } catch (err) {
        // Silently fall back — user still sees fallback suggestions
        setError("Couldn't load AI suggestions. Using defaults.");
      } finally {
        setLoading(false);
      }
    };

    fetchIcebreakers();
  }, [visible, matchId]);

  const handleShowAnother = () => {
    setCurrentIdx((prev) => getRandomIndex(prev, suggestions.length));
  };

  const currentSuggestion = suggestions[currentIdx] ?? "";

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen={false}>
      <View style={styles.container}>

        {/* Bot icon header */}
        <View style={styles.header}>
          <Image source={Icons.BotIcon} style={{ width: 70, height: 70 }} />
        </View>

        {/* Title */}
        <Text style={styles.title} className="font-PlusJakartaSansBold">
       BonBot Icebreaker
        </Text>
        <Text style={styles.subtitle} className="font-PlusJakartaSans">
          {matchId
            ? "Personalised just for your match ✨"
            : "Great conversation starters"}
        </Text>

        {/* Suggestion area */}
        <View style={styles.rizzItem}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.activePrimary} />
              <Text style={styles.loadingText} className="font-PlusJakartaSans">
                Crafting the perfect line...
              </Text>
            </View>
          ) : (
            <Text
              style={styles.rizzText}
              className="font-PlusJakartaSansSemiBold"
            >
              {currentSuggestion}
            </Text>
          )}
        </View>

        {/* Soft error notice (non-blocking) */}
        {error && !loading && (
          <Text style={styles.errorHint} className="font-PlusJakartaSans">
            {error}
          </Text>
        )}

        {/* Suggestion counter e.g. "1 / 3" */}
        {!loading && (
          <Text style={styles.counter} className="font-PlusJakartaSans">
            {currentIdx + 1} / {suggestions.length}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          {/* Refresh — show another */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleShowAnother}
            disabled={loading}
          >
            <MaterialIcons
              name="autorenew"
              size={26}
              color={loading ? "#ccc" : colors.activePrimary}
            />
          </TouchableOpacity>

          {/* Use This — sends into chat */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={() => {
              if (!loading && currentSuggestion) {
                onSend(currentSuggestion);
                onClose();
              }
            }}
            disabled={loading || !currentSuggestion}
          >
            <Text
              style={styles.primaryBtnText}
              className="font-PlusJakartaSansBold"
            >
              Use This
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
    textAlign: "center",
  },
  rizzItem: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 8,
    alignSelf: "stretch",
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  rizzText: {
    color: "#1F2937",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 6,
  },
  errorHint: {
    fontSize: 12,
    color: "#F59E0B",
    textAlign: "center",
    marginBottom: 4,
  },
  counter: {
    fontSize: 12,
    color: "#D1D5DB",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  iconBtn: {
    backgroundColor: "#FFF8F5",
    borderRadius: 50,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: colors.activePrimary,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "#F9A88A",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RizzModal;
