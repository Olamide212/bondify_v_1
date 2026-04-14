import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../constant/colors';

/**
 * LoadingImage — wraps expo-image's <Image> with a centered ActivityIndicator
 * that shows while the image is loading. Accepts all standard <Image> props.
 *
 * Props:
 *   opaqueLoader - if true, shows a fully opaque dark overlay while loading
 *                  (useful to prevent showing previous cached image)
 */
const LoadingImage = ({
  style,
  indicatorColor = colors.primary,
  indicatorSize = 'small',
  containerStyle,
  opaqueLoader = false,
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        {...imageProps}
        style={[styles.image, style]}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
      {isLoading && (
        <View style={[
          styles.loaderOverlay,
          opaqueLoader && styles.opaqueOverlay
        ]}>
          <ActivityIndicator size={indicatorSize} color={indicatorColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.6)',
  },
  opaqueOverlay: {
    backgroundColor: '#121212',
  },
});

export default LoadingImage;
