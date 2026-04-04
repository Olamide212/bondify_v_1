/**
 * ChatBackground.jsx
 *
 * A subtle dark chat background pattern, similar to WhatsApp / Telegram.
 * Renders a repeating SVG pattern behind the messages area.
 *
 * Usage:
 *   <ChatBackground>
 *     <ScrollView ... />
 *   </ChatBackground>
 */

import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Defs, G, Path, Pattern, Rect } from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const TILE = 60; // px – pattern tile size
const ICON_OPACITY = 0.045; // very subtle

/**
 * Tiny chat-themed icons drawn at 24×24 inside each tile.
 * They are rendered at low opacity so they feel like a watermark.
 */
const PatternIcons = () => (
  <G opacity={ICON_OPACITY}>
    {/* Heart */}
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="#E8A0BF"
      transform="translate(4, 3) scale(0.7)"
    />
    {/* Chat bubble */}
    <Path
      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
      fill="#9CA3AF"
      transform="translate(32, 6) scale(0.55)"
    />
    {/* Smiley */}
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1.41-1.41L10.17 14H4v-2h6.17l-1.59-1.59L10 9l4 4-4 4zm6-4h-2V8h2v5z"
      fill="#F6CE71"
      transform="translate(6, 34) scale(0.55)"
    />
    {/* Star */}
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="#E8A0BF"
      transform="translate(36, 34) scale(0.55)"
    />
  </G>
);

const ChatBackground = ({ children, style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      {/* SVG pattern layer – sits behind content */}
      <Svg
        width={SCREEN_W}
        height={SCREEN_H * 1.5}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id="chatPattern"
            x="0"
            y="0"
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
          >
            <PatternIcons />
          </Pattern>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={SCREEN_W}
          height={SCREEN_H * 1.5}
          fill="url(#chatPattern)"
        />
      </Svg>

      {/* Actual content (messages, input, etc.) */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },
});

export default ChatBackground;
