import { Image } from "expo-image";
import { Heart, Sparkles, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { colors } from "../../constant/colors";
import AIService from "../../services/aiService";
import BaseModal from "./BaseModal";

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x1200?text=No+Photo';

const extractImageUri = (item) => {
  if (!item) return null;
  if (typeof item === 'string' && item.length > 0) return item;
  if (typeof item === 'object')
    return item.url || item.uri || item.secure_url || item.imageUrl || item.src || null;
  return null;
};

const AiMatchSuggestionModal = ({
  visible,
  onClose,
  profile,
  currentUser,
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetUserId = profile?._id ?? profile?.id;

  const generateSuggestion = useCallback(async () => {
    if (!targetUserId) {
      setError("Profile not available. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await AIService.getMatchSuggestion(targetUserId);
      setSuggestion(result);
    } catch (err) {
      console.error('Failed to get match suggestion:', err);
      setError("Unable to get AI suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (visible && targetUserId && !suggestion && !loading) {
      generateSuggestion();
    }
  }, [visible, targetUserId, suggestion, loading, generateSuggestion]);

  const handleClose = () => {
    setSuggestion(null);
    setError(null);
    onClose();
  };

  // Get profile images
  const currentUserImage = currentUser?.images?.[0] ? extractImageUri(currentUser.images[0]) : FALLBACK_IMAGE;
  const profileImage = profile?.images?.[0] ? extractImageUri(profile.images[0]) : FALLBACK_IMAGE;

  return (
    <BaseModal visible={visible} onClose={handleClose} fullScreen={false} contentBackground={colors.background}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sparkles size={24} color={colors.secondary} />
            <Text style={styles.headerTitle}>Match Suggestion</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View> */}

        {/* Profile Images
        <View style={styles.imagesContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: currentUserImage }}
              style={styles.profileImage}
              contentFit="cover"
            />
            <Text style={styles.imageLabel}>You</Text>
          </View>

          <View style={styles.heartContainer}>
            <Heart
              size={32}
              color={suggestion?.isGoodMatch ? "#FF1493" : "#666"}
              fill={suggestion?.isGoodMatch ? "#FF1493" : "transparent"}
            />
          </View>

          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
              contentFit="cover"
            />
            <Text style={styles.imageLabel}>{profile?.name || profile?.firstName || 'Them'}</Text>
          </View>
        </View> */}

        {/* Content */}
        <View style={styles.content}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing compatibility...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={generateSuggestion} style={styles.retryButton}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {suggestion && !loading && !error && (
            <View style={styles.suggestionContainer}>
              <View style={styles.matchIndicator}>
                <Text style={[
                  styles.matchText,
                  { color: suggestion.isGoodMatch ? colors.primary : "#EF4444" }
                ]}>
                  {suggestion.isGoodMatch ? "Great Match Potential!" : "Maybe Not the Best Match"}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {suggestion.confidence}/10
                </Text>
              </View>

              <Text style={styles.reasonTitle}>Why?</Text>
              <Text style={styles.reasonText}>{suggestion.reason}</Text>

              <Text style={styles.suggestionTitle}>Suggestion:</Text>
              <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleClose} style={styles.closeModalButton}>
            <Text style={styles.closeModalText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    color: colors.secondary,
  },
  closeButton: {
    padding: 5,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 15,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  imageLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#9CA3AF',
    marginTop: 5,
    textAlign: 'center',
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    minHeight: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#fff',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
  },
  suggestionContainer: {
    gap: 15,
  },
  matchIndicator: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  matchText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSansBold',
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  reasonTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  reasonText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  suggestionTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
  
  },
  closeModalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  closeModalText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
  },
});

export default AiMatchSuggestionModal;