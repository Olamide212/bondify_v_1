import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import Button from "../../../../components/ui/Button";
import { useAlert } from "../../../../context/AlertContext";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";

const LocationAccess = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const { updateProfileStep, finalizeOnboarding } = useProfileSetup({
    isOnboarding: true,
  });

  const isOnboardingAlreadyCompletedError = (error) => {
    const message = typeof error === "string" 
      ? error 
      : error?.response?.data?.message || error?.message || "";
    return (
      typeof message === "string" &&
      message.toLowerCase().includes("onboarding already completed")
    );
  };

  const finalizeOnboardingSafely = async () => {
    try {
      await finalizeOnboarding();
    } catch (error) {
      if (!isOnboardingAlreadyCompletedError(error)) {
        throw error;
      }
    }
  };

  const handleLocationAccess = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert({
          icon: 'location',
          title: 'Permission Denied',
          message: 'Location permission is needed to find matches near you. You can enable it later in settings.',
          actions: [
            {
              label: 'Continue Anyway',
              style: 'primary',
              onPress: async () => {
                await finalizeOnboardingSafely();
                router.replace("/root-tabs");
              },
            },
          ],
        });
        setLoading(false);
        return;
      }

      let location = null;

      // 1) Try last known position first (instant, cached)
      try {
        location = await Location.getLastKnownPositionAsync();
      } catch {
        // No cached position available
      }

      // 2) If no cached location, get a fresh fix with timeout
      if (!location) {
        try {
          location = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 15000)
            ),
          ]);
        } catch {
          // Balanced accuracy failed or timed out — try lowest accuracy
          try {
            location = await Promise.race([
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest,
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("timeout")), 10000)
              ),
            ]);
          } catch {
            // All attempts failed
          }
        }
      }

      if (!location) {
        showAlert({
          icon: 'location',
          title: 'Location Unavailable',
          message: 'We couldn\'t determine your location right now. You can update it later in settings.',
          actions: [
            {
              label: 'Continue Anyway',
              style: 'primary',
              onPress: async () => {
                await finalizeOnboardingSafely();
                router.replace("/root-tabs");
              },
            },
          ],
        });
        setLoading(false);
        return;
      }

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

      await finalizeOnboardingSafely();

      router.replace("/root-tabs");
    } catch (err) {
      if (isOnboardingAlreadyCompletedError(err)) {
        router.replace("/root-tabs");
        return;
      }

      console.error("Location access error:", err);
      showAlert({
        icon: 'location',
        title: 'Location Error',
        message: 'Could not get your location. You can update it later in settings.',
        actions: [
          {
            label: 'Continue Anyway',
            style: 'primary',
            onPress: async () => {
              try {
                await finalizeOnboardingSafely();
              } catch (error) {
                console.error("Finalize onboarding error:", error);
              } finally {
                router.replace("/root-tabs");
              }
            },
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#121212] flex-1 px-6 justify-center items-center">
      <Image
        source={require("../../../../assets/images/location.png")}
        style={{ width: 180, height: 180 }}
        resizeMode="contain"
      />

      <Text className="text-2xl text-white font-PlusJakartaSansBold text-center mt-6 ">
        Enable Location Access
      </Text>

      <Text className="text-center text-white font-PlusJakartaSans mt-2 text-lg ">
        We use your location to show nearby users and matches based on
        proximity.
      </Text>

      <View className="w-full mt-8">
        <Button
          onPress={handleLocationAccess}
          variant="primary"
          title={loading ? "Getting Location..." : "Allow Location Access"}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default LocationAccess;
