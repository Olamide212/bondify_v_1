import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Rocket } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { colors } from '../../constant/colors';

const BoostModal = ({ visible, onClose, onBoost, isLoading = false }) => {
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Rocket size={48} color={colors.primary} fill={colors.primary} />
              </View>

              <Text style={styles.title}>Boost Your Profile</Text>

              <Text style={styles.description}>
                Get more visibility and matches by boosting your profile! You can boost up to 3 times per day. Your profile will be shown to more people for the next 24 hours.
              </Text>

              {/* <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Benefits:</Text>
                <Text style={styles.benefit}>• 10x more profile views</Text>
                <Text style={styles.benefit}>• Higher match chances</Text>
                <Text style={styles.benefit}>• Priority in discovery</Text>
              </View> */}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={onBoost}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.tertiary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Rocket size={20} color="#fff" />
                        <Text style={styles.boostButtonText}>Boost Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>I&apos;ll do this later</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '90%',
    minHeight: 450,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'OutfitBold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'OutfitBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  benefit: {
    fontSize: 14,
    fontFamily: 'Outfit',
    color: '#fff',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '80%',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  cancelButton: {
    alignItems: 'center',

    borderColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#fff',
    textAlign: 'center',
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  boostButtonText: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BoostModal;