import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import PhotoGuidelinesModal from "../../../../components/modals/PhotoGuidelinesModal";
import Button from "../../../../components/ui/Button";
import ProfileMediaView from "../../../../components/ui/ProfileMediaView";
import { colors } from "../../../../constant/colors";
import { useAlert } from "../../../../context/AlertContext";
import {
  getOnboardingProfileMediaDraft,
  saveOnboardingProfileMediaDraft,
} from "../../../../utils/onboardingProfileMediaDraft";

const UploadPhoto = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [uploading, setUploading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    let mounted = true;
    getOnboardingProfileMediaDraft().then((draft) => {
      if (!mounted || !Array.isArray(draft) || draft.length === 0) return;
      const restored = Array(6).fill(null);
      draft.slice(0, 6).forEach((item, index) => {
        restored[index] = item;
      });
      setPhotos(restored);
    });
    return () => {
      mounted = false;
    };
  }, []);

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
      mediaTypes: index === 0 ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const updatedPhotos = [...photos];
      updatedPhotos[index] = result.assets[0];
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
        title: 'Media Required',
        message: 'Please add at least one photo or video to continue.',
      });
      return;
    }

    if (!selectedPhotos.some((item) => item?.type === 'image')) {
      showAlert({
        icon: 'warning',
        title: 'Photo Required',
        message: 'Please include at least one photo as part of your profile media.',
      });
      return;
    }

    setUploading(true);
    try {
      await saveOnboardingProfileMediaDraft(selectedPhotos);
      router.push("/verification");
    } catch (err) {
      console.error("Photo upload error:", err);
      showAlert({
        icon: 'error',
        title: 'Upload Failed',
        message: String(err || 'Failed to save media. Please try again.'),
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
                <Text className="text-3xl font-PlusJakartaSansBold text-white  mb-2">
                  Add your best photos and videos
                </Text>
                {/* <TouchableOpacity
                  onPress={() => setShowGuidelines(true)}
                  className="bg-primary/10 p-2 rounded-full"
                >
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                </TouchableOpacity> */}
              </View>
              <View className="">
              <View>
            
                {/* <Lightbulb size={20} color={colors.primary} style={{ marginTop: 2 }} /> */}
              </View>
                <Text className='text-white font-PlusJakartaSansMedium text-base' numberOfLines={5}>Choose clear photos and short videos where your face is visible. Keep your main slot as a photo, and avoid blurry or poor-quality uploads for better matches.</Text>
              </View>
             
            </View>

            {/* Photo grid */}
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {photos.map((photo, index) => {
                const isMain = index === 0;
                return (
                <View key={index} className="w-[30%] h-[35%]  relative">
                  <TouchableOpacity
                    className={`w-full h-full rounded-2xl items-center justify-center bg-gray-900 border-2 ${isMain ? 'border-primary' : 'border-dashed border-white'}`}
                    onPress={() => pickImage(index)}
                    activeOpacity={0.7}
                  >
                    {photo ? (
                      <ProfileMediaView
                        media={photo}
                        containerStyle={{ width: '100%', height: '100%', borderRadius: 16 }}
                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                        showVideoBadge
                        shouldPlayVideo={false}
                      />
                    ) : (
                      <Ionicons name="add" size={32} color={colors.primary} />
                    )}
                  </TouchableOpacity>

                  {isMain && (
                    <View className="absolute top-2 left-2 bg-primary/90 px-2 py-1 rounded-full">
                      <Text className="text-white text-[10px] font-PlusJakartaSansBold tracking-wide uppercase">Main photo</Text>
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
                <Text className="ml-2 font-PlusJakartaSans text-gray-400 text-sm">
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
                <Text className="ml-2 font-PlusJakartaSans text-gray-400 text-sm">
                  Photos that don’t clearly show you will be removed.
                </Text>
              </View>
            </View>*/}
          </View> 

          {/* Next button */}
          <View className="items-end">
            <Button
              title={uploading ? "Saving..." : "Continue"}
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
