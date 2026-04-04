import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Keyboard,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import PhotoGuidelinesModal from "../../../../components/modals/PhotoGuidelinesModal";
import Button from "../../../../components/ui/Button";
import { colors } from "../../../../constant/colors";
import { useAlert } from "../../../../context/AlertContext";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import { profileService } from "../../../../services/profileService";

// Define colors object
const color = {
  primary: colors.primary, // Replace with your app's primary color if different
};

const UploadPhoto = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [uploading, setUploading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const pickImage = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        icon: 'camera',
        title: 'Permission Required',
        message: 'Permission to access media library is required!',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
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
      showAlert({
        icon: 'warning',
        title: 'Photos Required',
        message: 'Please add at least one photo to continue.',
      });
      return;
    }

    setUploading(true);
    try {
      await profileService.uploadPhotos(selectedPhotos);
      router.push("/verification");
    } catch (err) {
      console.error("Photo upload error:", err);
      showAlert({
        icon: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload photos. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: "#121212"}} className="bg-[#121212]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}} className="px-2">
          <View className='flex-1'>
            {/* Title + Subtitle */}
            <View className="mb-6 mt-8">
              <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-OutfitBold  mb-2">
                  Add your best photos
                </Text>
                <TouchableOpacity
                  onPress={() => setShowGuidelines(true)}
                  className="bg-primary/10 p-2 rounded-full"
                >
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View className="">
              <View>
            
                {/* <Lightbulb size={20} color={colors.primary} style={{ marginTop: 2 }} /> */}
              </View>
                <Text className='text-white font-OutfitMedium text-base' numberOfLines={5}>Choose photos where your face is clearly visible,also try to avoid blurred and poor quality images for your profile. High-quality, clear photos help you get 3x better connections and higher engagement.</Text>
              </View>
             
            </View>

            {/* Photo grid */}
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {photos.map((photo, index) => {
                const isMain = index === 0;
                return (
                <View key={index} className="w-[30%] h-[35%]  relative">
                  <TouchableOpacity
                    className={`w-full h-full rounded-xl items-center justify-center bg-gray-900 border-2 ${isMain ? 'border-primary' : 'border-dashed border-gray-600'}`}
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
                      <Ionicons name="add" size={32} color={colors.primary} />
                    )}
                  </TouchableOpacity>

                  {isMain && (
                    <View className="absolute top-2 left-2 bg-primary/90 px-2 py-1 rounded-full">
                      <Text className="text-white text-[10px] font-OutfitBold tracking-wide uppercase">Main photo</Text>
                    </View>
                  )}

                  {/* Remove button */}
                  {photo && (
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-primary rounded-full p-1"
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              );})}
            </View>

            {/* Info text */}
            {/* <View className="mt-6 gap-2">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="gray"
                  style={{ marginTop: 2 }}
                />
                <Text className="ml-2 font-Outfit text-gray-400 text-sm">
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
                <Text className="ml-2 font-Outfit text-gray-400 text-sm">
                  Photos that don’t clearly show you will be removed.
                </Text>
              </View>
            </View>*/}
          </View> 

          {/* Next button */}
          <View className="items-end">
            <Button
              title={uploading ? "Uploading..." : "Continue"}
              variant="primary"
              onPress={handleContinue}
              loading={uploading}
              disabled={uploading || photos.filter(Boolean).length < 3}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <PhotoGuidelinesModal visible={showGuidelines} onClose={() => setShowGuidelines(false)} />
    </SafeAreaView>
  );
};

export default UploadPhoto;
