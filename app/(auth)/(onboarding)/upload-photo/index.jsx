import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NextButton from "../../../../components/ui/NextButton";
import Button from "../../../../components/ui/Button"
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { profileService } from "../../../../services/profileService";

const UploadPhoto = () => {
  const router = useRouter();
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [uploading, setUploading] = useState(false);
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const pickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const updatedPhotos = [...photos];
      updatedPhotos[index] = result.assets[0].uri;
      setPhotos(updatedPhotos);
    }
  };

  const removeImage = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = null;
    setPhotos(updatedPhotos);
  };

  const handleContinue = async () => {
    const selectedPhotos = photos.filter((p) => p !== null);
    if (selectedPhotos.length === 0) {
      Alert.alert("Photos Required", "Please add at least one photo to continue.");
      return;
    }

    setUploading(true);
    try {
      await profileService.uploadPhotos(selectedPhotos);
      router.push("/profile-answers");
    } catch (err) {
      console.error("Photo upload error:", err);
      Alert.alert("Upload Failed", "Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-2">
          <View className='flex-1'>
            {/* Title + Subtitle */}
            <View className="mb-6 mt-8">
              <Text className="text-3xl font-SatoshiBold  mb-2">
                Add your photos
              </Text>
              <Text className="text-lg  font-Satoshi">
                Members with 6 photos find their match faster
              </Text>
            </View>

            {/* Photo grid */}
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {photos.map((photo, index) => (
                <View key={index} className="w-[30%] aspect-square relative">
                  <TouchableOpacity
                    className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl items-center justify-center bg-gray-50"
                    onPress={() => pickImage(index)}
                    activeOpacity={0.7}
                  >
                    {photo ? (
                      <Image
                        source={{ uri: photo }}
                        className="w-full h-full rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="add" size={32} color="#5A56D0" />
                    )}
                  </TouchableOpacity>

                  {/* Remove button */}
                  {photo && (
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-black rounded-full p-1"
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Info text */}
            <View className="mt-6 gap-2">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="gray"
                  style={{ marginTop: 2 }}
                />
                <Text className="ml-2 font-Satoshi text-gray-600 text-sm">
                  Add photos of you where you can clearly see your face.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="gray"
                  style={{ marginTop: 2 }}
                />
                <Text className="ml-2 font-Satoshi text-gray-600 text-sm">
                  Photos that don’t clearly show you will be removed.
                </Text>
              </View>
            </View>
          </View>

          {/* Next button */}
          <View className="items-end">
            <Button
              title={uploading ? "Uploading..." : "Continue"}
              variant="gradient"
              onPress={handleContinue}
              loading={uploading}
              disabled={uploading}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default UploadPhoto;
