import { Plus, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";

const MAX_PHOTOS = 6;

const ProfilePhotoGrid = ({ photos: initialPhotos = [], onAddPhoto, onRemovePhoto }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [removingIndex, setRemovingIndex] = useState(null);
  // Only track loading for already uploaded images
  const [imageLoading, setImageLoading] = useState(
    Array(initialPhotos.length).fill(false)
  );
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
          onPress={async () => {
            // Only show spinner after user selects a photo
            await onAddPhoto?.();
            setIsAdding(false);
          }}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#EE5F2B" />
          ) : (
            <Plus size={28} color="#999" />
          )}
        </TouchableOpacity>
      );
    }

    const imageUri = item?.url || item;

    return (
      <View className="w-full aspect-square rounded-xl overflow-hidden">
        <Image
          source={{ uri: imageUri }}
          className="w-full h-full"
          onLoadStart={() => {
            setImageLoading((prev) => {
              const arr = [...prev];
              arr[index] = true;
              return arr;
            });
          }}
          onLoadEnd={() => {
            setImageLoading((prev) => {
              const arr = [...prev];
              arr[index] = false;
              return arr;
            });
          }}
        />
        {imageLoading[index] && (
          <View className="absolute inset-0 bg-black/10 justify-center items-center">
            <ActivityIndicator size="small" color="#EE5F2B" />
          </View>
        )}
        <TouchableOpacity
          onPress={async () => {
            setRemovingIndex(index);
            try {
              await onRemovePhoto?.(item, index);
            } finally {
              setRemovingIndex(null);
            }
          }}
          className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
          disabled={removingIndex === index}
        >
          {removingIndex === index ? (
            <ActivityIndicator size={14} color="#fff" />
          ) : (
            <X size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
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
