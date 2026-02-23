import { Plus, X } from "lucide-react-native";
import { useMemo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const MAX_PHOTOS = 6;

const ProfilePhotoGrid = ({ photos: initialPhotos = [], onAddPhoto, onRemovePhoto }) => {
  // Fill remaining slots with nulls (for plus icons)
  const photoSlots = useMemo(() => {
    const filled = [...initialPhotos];
    while (filled.length < MAX_PHOTOS) {
      filled.push(null);
    }
    return filled;
  }, [initialPhotos]);

  const renderItem = (item, index) => {
    if (!item) {
      // Empty slot -> show plus icon
      return (
        <TouchableOpacity
          className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 justify-center items-center"
          onPress={onAddPhoto}
        >
          <Plus size={28} color="#999" />
        </TouchableOpacity>
      );
    }

    const imageUri = item?.url || item;

    // Normal photo slot
    return (
      <TouchableOpacity
        className="w-full aspect-square rounded-xl overflow-hidden"
      >
        <Image source={{ uri: imageUri }} className="w-full h-full" />
        <TouchableOpacity
          onPress={() => onRemovePhoto?.(item, index)}
          className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
        >
          <X size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View className="p-6  bg-white border border-gray-100 rounded-2xl mx-4 mt-4">
   
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {photoSlots.map((item, index) => (
          <View key={`photo-${index}`} className="w-[32.5%] aspect-square ">
            {renderItem(item, index)}
          </View>
        ))}
      </View>

    
    </View>
  );
};

export default ProfilePhotoGrid;
