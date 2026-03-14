import { Heart, Sparkles, X } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

/**
 * ActionButtons
 *
 * Props:
 *   onSwipe(direction: "left" | "right")  — pass and like
 *   onSuperLike()                          — super like (Sparkles button)
 *   Redo?: boolean                         — reserved for undo (future)
 */
const ActionButtons = ({ onSwipe, onSuperLike, Redo = false }) => (
  <View className="flex-row justify-center items-center gap-4 px-4 py-6">

    {/* Pass (Nope) */}
    <TouchableOpacity
      onPress={() => onSwipe?.("left")}
      activeOpacity={0.8}
      className="w-[50px] h-[50px] bg-white rounded-full items-center justify-center shadow"
    >
      <X size={26} color="#000" fill="#000" />
    </TouchableOpacity>

    {/* Super Like */}
    <TouchableOpacity
      onPress={() => onSuperLike?.()}
      activeOpacity={0.8}
      className="w-[70px] h-[70px] bg-primary rounded-full items-center justify-center"
      style={{
        shadowColor:   "#EE5F2B",
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius:  12,
        elevation:     8,
      }}
    >
      <Sparkles size={30} color="#fff" fill="#fff" />
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
);

export default ActionButtons;