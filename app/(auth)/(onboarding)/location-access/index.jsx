import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import Button from "../../../../components/ui/Button";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const LocationAccess = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { updateProfileStep, finalizeOnboarding } = useProfileSetup({
    isOnboarding: true,
  });

  const handleLocationAccess = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to find matches near you. You can enable it later in settings.",
          [
            {
              text: "Continue Anyway",
              onPress: async () => {
                await finalizeOnboarding();
                router.replace("root-tabs");
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get city/state/country
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      await updateProfileStep({
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
          city: geocode?.city || "",
          state: geocode?.region || "",
          country: geocode?.country || "",
        },
      });

      await finalizeOnboarding();

      router.replace("root-tabs");
    } catch (err) {
      console.error("Location access error:", err);
      Alert.alert(
        "Location Error",
        "Could not get your location. You can update it later in settings.",
        [
          {
            text: "Continue Anyway",
            onPress: async () => {
              await finalizeOnboarding();
              router.replace("root-tabs");
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white flex-1 px-6 justify-center items-center">
      <Image
        source={require("../../../../assets/images/location.png")}
        style={{ width: 150, height: 150 }}
        resizeMode="contain"
      />

      <Text className="text-2xl font-SatoshiBold text-center mt-6 ">
        Enable Location Access
      </Text>

      <Text className="text-center font-Satoshi mt-2 text-lg ">
        We use your location to show nearby users and matches based on
        proximity.
      </Text>

      <View className="w-full mt-8">
        <Button
          onPress={handleLocationAccess}
          variant="gradient"
          title={loading ? "Getting Location..." : "Allow Location Access"}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default LocationAccess;
