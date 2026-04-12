import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { Icons } from "../../constant/icons";
import AIService from "../../services/aiService";
import {Sparkles} from "lucide-react-native"

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
  const [showModal, setShowModal]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  // ── Animate in / out ──────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

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
        // AIService already unwraps the nested data envelope,
        // so response is { suggestions: [...] } directly
        const fetched  = response?.suggestions ?? response?.data?.suggestions;

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

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Centered card */}
      <View style={styles.centerWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.container}>

        {/* Bot icon header */}
        <View style={styles.header}>
<View className='p-5 bg-primary/10 rounded-xl'>
      <Sparkles color={colors.primary} fill={colors.primary} />
</View>
    
          {/* <Image source={Icons.BotIcon} style={{ width: 40, height: 40 }} /> */}
        </View>

        {/* Title */}
        <Text style={styles.title} className="font-PlusJakartaSansBold">
       BonSpark
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
              <ActivityIndicator size="small" color={colors.white} />
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
        {/* {!loading && (
          <Text style={styles.counter} className="font-PlusJakartaSans">
            {currentIdx + 1} / {suggestions.length}
          </Text>
        )} */}

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
              color={'#fff'}
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#121212",
    borderRadius: 20,
    width: "100%",
    maxWidth: 380,
  },
  container: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: '#E5E7EB',
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
    color: '#E5E7EB',
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
    backgroundColor: colors.primary,
    borderRadius: 50,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: colors.white,
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RizzModal;
