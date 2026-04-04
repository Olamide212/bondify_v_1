// components/ImageCarousel.jsx
import { useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import LoadingImage from '../ui/LoadingImage';

const { width, height } = Dimensions.get("window");

export default function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <LoadingImage
            source={{ uri: item }}
            style={styles.image}
            containerStyle={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            indicatorColor="#fff"
          />
        )}
      />
      <View style={styles.progressBar}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: {
    width: width * 0.9,
    height: height * 0.75,
  },
  progressBar: {
    position: "absolute",
    top: 15,
    flexDirection: "row",
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#121212",
    width: 12,
  },
  inactiveDot: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
