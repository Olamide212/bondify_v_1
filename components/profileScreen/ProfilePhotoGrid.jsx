import React, { useState, useMemo } from "react";
import { View, Image, TouchableOpacity, Text } from "react-native";
import { X, Plus } from "lucide-react-native";
import DraggableFlatList from "react-native-draggable-flatlist";

const MAX_PHOTOS = 6;

const ProfilePhotoGrid = ({ photos: initialPhotos }) => {
  const [photos, setPhotos] = useState(initialPhotos);

  // Fill remaining slots with nulls (for plus icons)
  const photoSlots = useMemo(() => {
    const filled = [...photos];
    while (filled.length < MAX_PHOTOS) {
      filled.push(null);
    }
    return filled;
  }, [photos]);

  const renderItem = ({ item, drag, isActive, index }) => {
    if (!item) {
      // Empty slot -> show plus icon
      return (
        <TouchableOpacity
          className="relative w-[30%] aspect-square rounded-xl overflow-hidden m-1 bg-gray-100 justify-center items-center"
          onPress={() => console.log("Add new photo")}
        >
          <Plus size={28} color="#999" />
        </TouchableOpacity>
      );
    }

    // Normal photo slot
    return (
      <TouchableOpacity
        onLongPress={drag} // enables dragging
        disabled={isActive}
        className="relative w-[30%] aspect-square rounded-xl overflow-hidden m-1"
      >
        <Image source={{ uri: item }} className="w-full h-full" />
        <TouchableOpacity
          onPress={() =>
            setPhotos((prev) => prev.filter((_, idx) => idx !== index))
          }
          className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
        >
          <X size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View className="px-4 pb-9 bg-white rounded-b-2xl mb-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-xl font-SatoshiMedium">My photos</Text>
      </View>

      <DraggableFlatList
        data={photoSlots}
        onDragEnd={
          ({ data }) => setPhotos(data.filter((item) => item !== null)) // remove nulls when saving
        }
        keyExtractor={(_, index) => `photo-${index}`}
        renderItem={renderItem}
        numColumns={3} // ensures grid layout
      />

      <Text className="mt-3 text-xl font-SatoshiMedium text-gray-500 text-center">
        Hold and drag your photos to reorder
      </Text>
    </View>
  );
};

export default ProfilePhotoGrid;
