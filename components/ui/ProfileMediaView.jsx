import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Eye, Play } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constant/colors";
import { getProfileMediaType, getProfileMediaUrl } from "../../utils/profileMedia";

const fitToResizeMode = (contentFit) => {
  if (contentFit === "contain") return ResizeMode.CONTAIN;
  if (contentFit === "fill") return ResizeMode.STRETCH;
  return ResizeMode.COVER;
};

const ProfileMediaView = ({
  media,
  style,
  containerStyle,
  contentFit = "cover",
  blurRadius = 0,
  showVideoBadge = false,
  showBlurBadge = true,
  shouldPlayVideo = true,
  isMuted = true,
  isLooping = true,
  maxPreviewMs,
  useNativeControls = false,
  onLoadStart,
  onLoad,
  onError,
}) => {
  const uri = getProfileMediaUrl(media);
  const mediaType = getProfileMediaType(media);
  const videoRef = useRef(null);
  const resettingPreviewRef = useRef(false);

  const handlePlaybackStatusUpdate = useCallback(
    async (status) => {
      if (
        mediaType !== "video" ||
        !maxPreviewMs ||
        !shouldPlayVideo ||
        !status?.isLoaded ||
        resettingPreviewRef.current
      ) {
        return;
      }

      if (status.positionMillis >= maxPreviewMs - 150) {
        resettingPreviewRef.current = true;

        try {
          await videoRef.current?.setPositionAsync(0);
          await videoRef.current?.playAsync();
        } catch {
          // ignore preview loop reset errors
        } finally {
          resettingPreviewRef.current = false;
        }
      }
    },
    [maxPreviewMs, mediaType, shouldPlayVideo]
  );

  useEffect(() => {
    if (mediaType !== "video" || !videoRef.current) return;

    if (!shouldPlayVideo) {
      videoRef.current.pauseAsync?.().catch(() => {});
      videoRef.current.setPositionAsync?.(0).catch(() => {});
    }
  }, [mediaType, shouldPlayVideo, uri]);

  if (!uri) {
    return <View style={[styles.container, containerStyle, style]} />;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {mediaType === "video" ? (
        <Video
          ref={videoRef}
          source={{ uri }}
          style={[StyleSheet.absoluteFillObject, style]}
          resizeMode={fitToResizeMode(contentFit)}
          shouldPlay={shouldPlayVideo}
          isLooping={maxPreviewMs ? false : isLooping}
          isMuted={isMuted}
          useNativeControls={useNativeControls}
          progressUpdateIntervalMillis={250}
          onLoadStart={onLoadStart}
          onLoad={onLoad}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={onError}
        />
      ) : (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFillObject, style]}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          transition={200}
          blurRadius={blurRadius}
          onLoadStart={onLoadStart}
          onLoad={onLoad}
          onError={onError}
        />
      )}

      {/* Blur overlay for videos when blurPhotos is enabled */}
      {mediaType === "video" && blurRadius > 0 && (
        <BlurView
          style={StyleSheet.absoluteFillObject}
          intensity={50}
          tint="dark"
        />
      )}

      {/* Blur badge for both images and videos */}
      {blurRadius > 0 && showBlurBadge && (
        <View style={styles.blurBadge}>
          <Eye size={16} color="#fff" />
          <Text style={styles.blurBadgeText}>
            {mediaType === "video" ? "Video blurred" : "Photos are blurred"}
          </Text>
        </View>
      )}

      {showVideoBadge && mediaType === "video" && (
        <View style={styles.videoBadge} pointerEvents="none">
          <Play size={14} color="#fff" fill="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.black || "#000",
  },
  videoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  blurBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -70 }, { translateY: -15 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  blurBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ProfileMediaView;