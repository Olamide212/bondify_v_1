/**
 * WheelPicker.js
 *
 * A drum-roll scroll picker that matches the Bondies onboarding design.
 * Shows 2 items above and below the selected value; the selected item
 * is large, bold and in the primary colour.
 *
 * Props:
 *   items        — array of { label: string, value: any }
 *   selectedValue
 *   onValueChange(value)
 *   itemHeight   — height of each row in px (default 56)
 *   visibleItems — how many rows to show total (default 5, must be odd)
 *   suffix       — optional string rendered next to the selected label (e.g. "cm")
 */

import { useCallback, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constant/colors";

const PRIMARY   = colors.primary;
const ITEM_H    = 56;
const VISIBLE   = 5;           // must be odd — centre row = selected

const WheelPicker = ({
  items = [],
  selectedValue,
  onValueChange,
  itemHeight  = ITEM_H,
  visibleItems = VISIBLE,
  suffix,
}) => {
  const listRef    = useRef(null);
  const scrollY    = useRef(new Animated.Value(0)).current;
  const halfVisible = Math.floor(visibleItems / 2);   // 2
  const containerH  = itemHeight * visibleItems;

  // Pad with empty sentinel items top/bottom so first/last items can centre
  const padded = [
    ...Array(halfVisible).fill({ label: "", value: "__pad_start__" }),
    ...items,
    ...Array(halfVisible).fill({ label: "", value: "__pad_end__" }),
  ];

  const selectedIndex = items.findIndex(
    (it) => String(it.value) === String(selectedValue)
  );

  // Scroll to selected index whenever it changes externally
  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    listRef.current.scrollToIndex({
      index: selectedIndex,          // padded offset added inside getItemLayout
      animated: true,
    });
  }, [selectedIndex]);

  const handleScroll = useCallback(
    (e) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const rawIndex = Math.round(offsetY / itemHeight);
      const clampedIndex = Math.max(0, Math.min(rawIndex, items.length - 1));
      if (items[clampedIndex] && items[clampedIndex].value !== selectedValue) {
        onValueChange?.(items[clampedIndex].value);
      }
    },
    [items, itemHeight, selectedValue, onValueChange]
  );

  const handleMomentumEnd = handleScroll;

  const renderItem = useCallback(
    ({ item, index }) => {
      const isPad      = item.value === "__pad_start__" || item.value === "__pad_end__";
      const realIndex  = index - halfVisible;   // index into original items[]
      const isSelected = realIndex === selectedIndex;
      const distance   = Math.abs(realIndex - selectedIndex);

      if (isPad) return <View style={{ height: itemHeight }} />;

      // Progressive opacity: selected=1, ±1=0.45, ±2=0.18
      const opacity = isSelected ? 1 : distance === 1 ? 0.45 : 0.18;
      const fontSize = isSelected ? 28 : distance === 1 ? 24 : 20;
      const fontWeight = isSelected ? "700" : "400";

      return (
        <View style={[styles.row, { height: itemHeight }]}>
          <Text
            style={[
              styles.label,
              {
                opacity,
                fontSize,
                fontWeight,
                color: isSelected ? PRIMARY : "#111",
                fontFamily: isSelected
                  ? "OutfitBold"
                  : "Outfit",
              },
            ]}
          >
            {item.label}
            {isSelected && suffix ? (
              <Text
                style={{
                  fontSize: 18,
                  color: PRIMARY,
                  fontFamily: "Outfit",
                }}
              >
                {" "}
                {suffix}
              </Text>
            ) : null}
          </Text>
        </View>
      );
    },
    [selectedIndex, itemHeight, halfVisible, suffix]
  );

  return (
    <View style={[styles.container, { height: containerH }]}>
      {/* Selection highlight stripe */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionStripe,
          {
            top:    itemHeight * halfVisible,
            height: itemHeight,
          },
        ]}
      />

      <Animated.FlatList
        ref={listRef}
        data={padded}
        keyExtractor={(item, index) => `${item.value}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScroll}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        initialScrollIndex={Math.max(0, selectedIndex)}
        contentContainerStyle={{ paddingVertical: 0 }}
        style={{ overflow: "hidden" }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  row: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
  },
  selectionStripe: {
    position:        "absolute",
    left:            20,
    right:           20,
    borderTopWidth:  1.5,
    borderBottomWidth: 1.5,
    borderColor: '#374151',
    zIndex:          10,
    pointerEvents:   "none",
  },
});

export default WheelPicker;