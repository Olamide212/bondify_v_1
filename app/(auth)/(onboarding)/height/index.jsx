
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const Height = () => {
  const [selectedHeight, setSelectedHeight] = useState(170); // default to 170 cm
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const heights = Array.from({ length: 151 }, (_, i) => i + 100); // 100 - 250 cm

  return (
    <View className="bg-white flex-1">
      <View style={styles.container}>
        <Text className="text-3xl font-SatoshiBold">How Tall Are You?</Text>
        <Text className='text-lg font-Satoshi mb-4'>
          Please provide your height in centimeters
        </Text>

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedHeight}
            onValueChange={(itemValue) => setSelectedHeight(itemValue)}
            itemStyle={styles.pickerItem}
          >
            {heights.map((height) => (
              <Picker.Item key={height} label={`${height} cm`} value={height} />
            ))}
          </Picker>
        </View>
      </View>
      <View className="w-full items-end pb-6">
        <Button title="Continue" variant="gradient" onPress={async () => {
          await updateProfileStep({ height: selectedHeight });
          router.push("/gender");
        }} />
      </View>
    </View>
  );
};

export default Height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 25,
    fontFamily: "SatoshiBold",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#000",
    fontFamily: "Satoshi",
    marginBottom: 30,
  },
  pickerWrapper: {
    width: "100%",
    height: 180,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  pickerItem: {
    fontSize: 28,
    height: 200,
    fontFamily: "SatoshiBold",
    color: "#000",
  },
});