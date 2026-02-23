import * as ExpoLocation from "expo-location";
import { X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import BaseModal from "../modals/BaseModal";

const Location = ({ profile, onUpdateField }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [country, setCountry] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const locationText = useMemo(() => {
    if (typeof profile?.location === "string") {
      return profile.location;
    }

    return [profile?.location?.city, profile?.location?.state, profile?.location?.country]
      .filter(Boolean)
      .join(", ");
  }, [profile?.location]);

  useEffect(() => {
    if (typeof profile?.location === "object" && profile?.location) {
      setCity(profile.location.city || "");
      setStateValue(profile.location.state || "");
      setCountry(profile.location.country || "");
      return;
    }

    if (typeof profile?.location === "string") {
      const [cityPart = "", statePart = "", countryPart = ""] = profile.location
        .split(",")
        .map((value) => value.trim());
      setCity(cityPart);
      setStateValue(statePart);
      setCountry(countryPart);
    }
  }, [profile?.location]);

  const handleUseCurrentLocation = async () => {
    try {
      setIsDetectingLocation(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow location permission to use current location.");
        return;
      }

      const deviceLocation = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = deviceLocation.coords;
      const [geocode] = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });

      setCity(geocode?.city || geocode?.district || "");
      setStateValue(geocode?.region || "");
      setCountry(geocode?.country || "");
    } catch (_error) {
      Alert.alert("Location error", "Could not fetch your current location. Try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!city && !stateValue && !country) {
      Alert.alert("Missing location", "Enter at least one location field.");
      return;
    }

    const baseLocation =
      typeof profile?.location === "object" && profile?.location ? profile.location : {};

    const payload = {
      ...baseLocation,
      city,
      state: stateValue,
      country,
    };

    try {
      setIsSaving(true);
      await onUpdateField?.("location", payload);
      setIsModalVisible(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        className="px-6 py-4 bg-white border border-gray-100 mx-4 rounded-2xl"
        onPress={() => setIsModalVisible(true)}
      >
       
        <View className="mb-1">
          <Text className="text-black text-2xl font-SatoshiMedium">
            {locationText || "Location not set"}
          </Text>
          <Text className="flex-1 text-lg text-primary font-SatoshiMedium">
            Change your location
          </Text>
        </View>
      </TouchableOpacity>

      <BaseModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} fullScreen>
        <View className="flex-1 bg-white p-6">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <X />
            </TouchableOpacity>
            <Text className="text-xl font-SatoshiBold">Edit Location</Text>
            <View />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-full py-4 px-5 mb-6"
            onPress={handleUseCurrentLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text className="text-white text-center text-lg font-GeneralSansMedium">
                Use Current Location
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-lg text-black font-GeneralSansMedium mb-2">City</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          />

          <Text className="text-lg text-black font-GeneralSansMedium mb-2">State</Text>
          <TextInput
            value={stateValue}
            onChangeText={setStateValue}
            placeholder="Enter state"
            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base"
          />

          <Text className="text-lg text-black font-GeneralSansMedium mb-2">Country</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="Enter country"
            className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
          />

          <TouchableOpacity
            className="bg-black rounded-full py-4 px-5"
            onPress={handleSaveLocation}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text className="text-white text-center text-lg font-GeneralSansMedium">
                Save Location
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BaseModal>
    </>
  );
};

export default Location;
