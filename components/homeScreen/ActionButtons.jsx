import { Heart, MessageCircle, X } from "lucide-react-native";
import { memo } from "react";
import { TouchableOpacity, View } from "react-native";

/**
 * ActionButtons
 *
 * Props:
 *   onSwipe(direction: "left" | "right")  — pass and like
 *   onCompliment()                         — open compliment modal
 *   Redo?: boolean                         — reserved for undo (future)
 */
const ActionButtons = ({ onSwipe, onCompliment, Redo = false }) => (
  <View className="flex-row justify-between items-center px-4 py-6">

    {/* Compliment - Left side */}
    <TouchableOpacity
      onPress={() => onCompliment?.()}
      activeOpacity={0.8}
      className="w-[60px] h-[60px] bg-primary rounded-full items-center justify-center"
    >
      <MessageCircle size={28} color="#fff" fill="#fff" />
    </TouchableOpacity>

    {/* Nope + Like - Right side */}
    <View className="flex-row items-center gap-4">
      {/* Pass (Nope) */}
      <TouchableOpacity
        onPress={() => onSwipe?.("left")}
        activeOpacity={0.8}
        className="w-[50px] h-[50px] bg-white rounded-full items-center justify-center shadow"
      >
        <X size={26} color="#000" fill="#000" />
      </TouchableOpacity>

      {/* Like */}
      <TouchableOpacity
        onPress={() => onSwipe?.("right")}
        activeOpacity={0.8}
        className="w-[50px] h-[50px] bg-white rounded-full items-center justify-center shadow"
      >
        <Heart size={26} color="#FB3857" fill="#FB3857" />
      </TouchableOpacity>
    </View>

  </View>
);

ActionButtons.displayName = 'ActionButtons';

export default memo(ActionButtons);
