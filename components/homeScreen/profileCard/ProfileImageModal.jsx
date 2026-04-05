import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { colors } from "../../../constant/colors";

const { width, height } = Dimensions.get("window");

const SWIPE_DOWN_THRESHOLD = 120;

const ProfileImageModal = ({
  visible,
  onClose,
  totalImages,
  modalImageIndex,
  onChangeImageIndex,
  getImageUri,
  isImageCacheHydrated,
  isUriCached,
  onMarkUriLoaded,
  blurPhotos = false,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const modalFlatListRef = useRef(null);

  // ── Swipe-down gesture state ───────────────────────────────────────────────
  const translateY   = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(1)).current;

  // Reset position whenever modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      backdropOpacity.setValue(1);
    }
  }, [visible, translateY, backdropOpacity]);

  useEffect(() => {
    if (!visible || !modalFlatListRef.current) return;

    requestAnimationFrame(() => {
      modalFlatListRef.current?.scrollToIndex({
        index: modalImageIndex,
        animated: false,
      });
    });
  }, [modalImageIndex, visible]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > SWIPE_DOWN_THRESHOLD) {
        // Animate out, then close
        Animated.parallel([
          Animated.timing(translateY,     { toValue: height, duration: 250, useNativeDriver: true }),
          Animated.timing(backdropOpacity, { toValue: 0,      duration: 250, useNativeDriver: true }),
        ]).start(() => {
          translateY.setValue(0);
          backdropOpacity.setValue(1);
          onClose();
        });
      } else {
        // Snap back
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
      }
    }
  };

  // Clamp translateY so it only moves downward
  const clampedY = translateY.interpolate({
    inputRange:  [-20, 0, height],
    outputRange: [-8,  0, height],
    extrapolate: 'clamp',
  });

  const dynamicOpacity = translateY.interpolate({
    inputRange:  [0, SWIPE_DOWN_THRESHOLD * 1.5],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      onRequestClose={onClose}
      animationType="fade"
    >
      {/* Backdrop */}
      <Animated.View style={{ flex: 1, backgroundColor: "#000", opacity: backdropOpacity }}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetY={[0, 10]}
          failOffsetX={[-30, 30]}
        >
          <Animated.View
            style={{ flex: 1, transform: [{ translateY: clampedY }], opacity: dynamicOpacity }}
          >
            {/* Close button */}
            <Pressable
              className="absolute top-14 right-6 z-50 bg-black/50 rounded-full p-2"
              onPress={onClose}
            >
              <X color="white" size={24} />
            </Pressable>

            {/* Swipe hint */}
            <View style={{ position: 'absolute', top: 10, alignSelf: 'center', zIndex: 50 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' }} />
            </View>

            <View style={{flex: 1}} className="justify-center">
              <FlatList
                ref={modalFlatListRef}
                data={Array.from({ length: totalImages }, (_, index) => index)}
                keyExtractor={(item) => String(item)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={modalImageIndex}
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                renderItem={({ item: index }) => {
                  const uri = getImageUri(index);

                  return (
                    <View style={{ width, height: "100%" }}>
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        blurRadius={blurPhotos ? 25 : 0}
                        onLoadStart={() => {
                          if (isImageCacheHydrated && !isUriCached(uri)) {
                            setIsImageLoading(true);
                          }
                        }}
                        onLoad={async () => {
                          await onMarkUriLoaded(uri);
                          setIsImageLoading(false);
                        }}
                        onError={() => setIsImageLoading(false)}
                      />
                    </View>
                  );
                }}
                onMomentumScrollEnd={(event) => {
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                  onChangeImageIndex(nextIndex);
                }}
              />

              {isImageLoading && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </View>

            <View className="absolute bottom-10 left-0 right-0 flex-row justify-center">
              {Array.from({ length: totalImages }).map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full mx-1 ${
                    index === modalImageIndex ? "bg-[#121212]" : "bg-gray-400"
                  }`}
                />
              ))}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  );
};

export default ProfileImageModal;

