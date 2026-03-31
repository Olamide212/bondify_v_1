import { BlurView } from "expo-blur";
import { Heart, RotateCcw, Sparkles, X } from "lucide-react-native";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";

/**
 * ActionButtons
 *
 * Props:
 *   onSwipe(direction: "left" | "right")  — pass and like
 *   onCompliment()                         — open compliment modal
 *   onRewind()                             — rewind last pass
 *   Redo?: boolean                         — show rewind button
 */
const ActionButtons = ({ onSwipe, onCompliment, onRewind, Redo = false }) => (
  <View className="flex-row justify-between items-center px-4 py-6">

    {/* Compliment - Left side */}
    <TouchableOpacity
      onPress={() => onCompliment?.()}
      activeOpacity={0.8}
      className="w-[60px] h-[60px] rounded-full overflow-hidden"
    >
      <BlurView
        intensity={30}
        tint="light"
        className="flex-1 items-center justify-center border border-white/20"
      >
        <Sparkles size={28} color="#fff" fill="#fff" />
      </BlurView>
    </TouchableOpacity>

    {/* Rewind + Nope + Like - Center/Right side */}
    <View className="flex-row items-center gap-4">
      {/* Rewind (only show when Redo is true) */}
      {Redo && (
        <TouchableOpacity
          onPress={() => onRewind?.()}
          activeOpacity={0.8}
          className="w-[50px] h-[50px] rounded-full overflow-hidden"
        >
          <View
            intensity={25}
            tint="light"
            className="flex-1 items-center justify-center bg-yellow-500"
          >
            <RotateCcw size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Pass (Nope) */}
      <TouchableOpacity
        onPress={() => onSwipe?.("left")}
        activeOpacity={0.8}
        className="w-[50px] h-[50px] rounded-full overflow-hidden"
      >
        <View
          intensity={25}
          tint="light"
          className="flex-1 items-center justify-center bg-white"
        >
          <X size={26} color="#000" fill="#000" />
        </View>
      </TouchableOpacity>

      {/* Like */}
      <TouchableOpacity
        onPress={() => onSwipe?.("right")}
        activeOpacity={0.8}
        className="w-[60px] h-[60px] rounded-full overflow-hidden"
      >
        <View
          intensity={25}
          tint="light"
          className="flex-1 items-center justify-center bg-primary"
        >
          <Heart size={26} color="#fff" fill="#fff" />
        </View>
      </TouchableOpacity>
    </View>

  </View>
);

ActionButtons.displayName = 'ActionButtons';

export default memo(ActionButtons);
