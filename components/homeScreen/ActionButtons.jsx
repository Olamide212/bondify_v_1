import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Sparkles, X } from "lucide-react-native";
import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constant/colors";

/**
 * ActionButtons — Gen Z Edition 🔥
 *
 * Two main buttons: "I'll pass" (left swipe) and "I'll bond" (right swipe)
 * Compliment button remains as a floating icon
 *
 * Props:
 *   onSwipe(direction: "left" | "right")  — pass and bond
 *   onCompliment()                         — open compliment modal
 *   onRewind()                             — rewind last pass (moved to card corner)
 *   Redo?: boolean                         — show rewind button
 */
const ActionButtons = ({ onSwipe, onCompliment, onRewind, Redo = false }) => (
  <View style={styles.container}>
    {/* I'll Pass Button */}
    <TouchableOpacity
      onPress={() => onSwipe?.("left")}
      activeOpacity={0.85}
      style={styles.passButton}
    >
      <BlurView style={styles.passInner}  intensity={20}
        tint="dark">
        <X size={20} color="#fff" strokeWidth={2.5} />
        <Text style={styles.passText}>I'll Pass</Text>
      </BlurView>
    </TouchableOpacity>

    {/* Compliment Button - Center */}
    <TouchableOpacity
      onPress={() => onCompliment?.()}
      activeOpacity={0.8}
      style={styles.complimentButton}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={styles.complimentInner}
      >
        <Sparkles size={22} color="#fff" fill="#fff" />
      </BlurView>
    </TouchableOpacity>

    {/* I'll Bond Button */}
    <TouchableOpacity
      onPress={() => onSwipe?.("right")}
      activeOpacity={0.85}
      style={styles.bondButton}
    >
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bondGradient}
      >
        <Heart size={20} color="#fff" fill="#fff" />
        <Text style={styles.bondText}>I'll Bond</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  passButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  passInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  passText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  complimentButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  complimentInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bondButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  bondGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bondText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

ActionButtons.displayName = 'ActionButtons';

export default memo(ActionButtons);

/* ─────────────────────────────────────────────────────────────────────────────
 * ORIGINAL ACTION BUTTONS (COMMENTED OUT)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * const ActionButtonsOriginal = ({ onSwipe, onCompliment, onRewind, Redo = false }) => (
 *   <View className="flex-row justify-between items-center px-4 py-6">
 *
 *     {/* Compliment - Left side *}
 *     <TouchableOpacity
 *       onPress={() => onCompliment?.()}
 *       activeOpacity={0.8}
 *       className="w-[60px] h-[60px] rounded-full overflow-hidden"
 *     >
 *       <BlurView
 *         intensity={15}
 *         tint="light"
 *         className="flex-1 items-center justify-center border border-white/20"
 *       >
 *         <Sparkles size={28} color="#fff" fill="#fff" />
 *       </BlurView>
 *     </TouchableOpacity>
 *
 *     {/* Rewind + Nope + Like - Center/Right side *}
 *     <View className="flex-row items-center gap-4">
 *       {/* Rewind (only show when Redo is true) *}
 *       {Redo && (
 *         <TouchableOpacity
 *           onPress={() => onRewind?.()}
 *           activeOpacity={0.8}
 *           className="w-[50px] h-[50px] rounded-full overflow-hidden"
 *         >
 *           <View
 *             intensity={25}
 *             tint="light"
 *             className="flex-1 items-center justify-center bg-yellow-500"
 *           >
 *             <RotateCcw size={24} color="#fff" />
 *           </View>
 *         </TouchableOpacity>
 *       )}
 *
 *       {/* Pass (Nope) *}
 *       <TouchableOpacity
 *         onPress={() => onSwipe?.("left")}
 *         activeOpacity={0.8}
 *         className="w-[50px] h-[50px] rounded-full overflow-hidden"
 *       >
 *         <BlurView
 *           intensity={15}
 *           tint="light"
 *           className="flex-1 items-center justify-center bg-[#121212] border border-white/20"
 *         >
 *           <X size={26} color="#fff" fill="#fff" />
 *         </BlurView>
 *       </TouchableOpacity>
 *
 *       {/* Like *}
 *       <TouchableOpacity
 *         onPress={() => onSwipe?.("right")}
 *         activeOpacity={0.8}
 *         className="w-[60px] h-[60px] rounded-full overflow-hidden"
 *       >
 *         <LinearGradient colors={[colors.primary, colors.secondary]} style={{flex: 1}}>
 *           <BlurView
 *             intensity={25}
 *             tint="light"
 *             className="flex-1 items-center justify-center"
 *           >
 *             <Heart size={26} color="#fff" fill="#fff" />
 *           </BlurView>
 *         </LinearGradient>
 *       </TouchableOpacity>
 *     </View>
 *
 *   </View>
 * );
 */
