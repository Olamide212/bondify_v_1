import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {colors} from "../../constant/colors";

const GeneralHeader = ({ title, icon, onPress, leftIcon, style, textStyle }) => {
  const router = useRouter();


  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.side}
      >
        {leftIcon}
      </Pressable>

      <Text style={[styles.title, { color: colors.white }, textStyle]}>
        {title}
      </Text>

      <Pressable
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.side}
      >
        {icon}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  
  },
  title: {
    fontSize: 20,
    fontFamily: "PlusJakartaSansBold",
  },
  // Keeps title centred when one side is empty
  side: {
    minWidth: 28,
    alignItems: "center",
  },
});

export default GeneralHeader;