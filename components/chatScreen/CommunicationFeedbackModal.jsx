/**
 * CommunicationFeedbackModal Component
 * 
 * A modal that prompts users to rate their communication experience
 * with their match. Can be triggered after a certain number of messages
 * or days of conversation.
 */

import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FEEDBACK_TYPES, submitFeedback } from '../../services/communicationService';

const CommunicationFeedbackModal = ({
  visible,
  onClose,
  aboutUserId,
  aboutUserName,
  matchId,
  messagesExchanged = 0,
  onSubmitSuccess,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [selectedType, setSelectedType] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const positiveTypes = Object.entries(FEEDBACK_TYPES).filter(
    ([, info]) => info.category === 'positive'
  );
  const negativeTypes = Object.entries(FEEDBACK_TYPES).filter(
    ([, info]) => info.category === 'negative' || info.category === 'warning'
  );
  
  const handleSubmit = useCallback(async () => {
    if (!selectedType) {
      setError('Please select a feedback option');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await submitFeedback({
        aboutUserId,
        matchId,
        feedbackType: selectedType,
        comment: comment.trim(),
        messagesExchanged,
      });
      
      if (result.success) {
        onSubmitSuccess?.(result.data);
        onClose();
      } else {
        setError(result.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedType, comment, aboutUserId, matchId, messagesExchanged, onClose, onSubmitSuccess]);
  
  const handleSkip = () => {
    onClose();
  };
  
  const renderFeedbackOption = ([key, info]) => {
    const isSelected = selectedType === key;
    
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => setSelectedType(key)}
        style={[
          styles.feedbackOption,
          {
            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
            borderColor: isSelected ? info.color : isDark ? '#374151' : '#E5E7EB',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <Text style={styles.feedbackEmoji}>{info.emoji}</Text>
        <View style={styles.feedbackTextContainer}>
          <Text
            style={[
              styles.feedbackLabel,
              { color: isDark ? '#F9FAFB' : '#1F2937' },
            ]}
          >
            {info.label}
          </Text>
          <Text
            style={[
              styles.feedbackDescription,
              { color: isDark ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            {info.description}
          </Text>
        </View>
        {isSelected && (
          <View
            style={[
              styles.selectedIndicator,
              { backgroundColor: info.color },
            ]}
          >
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#F9FAFB' : '#1F2937' },
              ]}
            >
              How's your conversation?
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              Help others by sharing your experience with {aboutUserName}
            </Text>
          </View>
          
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Positive Options */}
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#9CA3AF' : '#6B7280' },
              ]}
            >
              Positive Experience
            </Text>
            {positiveTypes.map(renderFeedbackOption)}
            
            {/* Negative Options */}
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 16 },
              ]}
            >
              Areas of Concern
            </Text>
            {negativeTypes.map(renderFeedbackOption)}
            
            {/* Optional Comment */}
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 16 },
              ]}
            >
              Additional Comments (Optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share any additional thoughts..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              maxLength={500}
              style={[
                styles.commentInput,
                {
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                  color: isDark ? '#F9FAFB' : '#1F2937',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                },
              ]}
            />
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </ScrollView>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.skipButtonText,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                ]}
              >
                Skip for now
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedType}
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedType ? '#8B5CF6' : isDark ? '#374151' : '#E5E7EB',
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: selectedType ? '#FFFFFF' : isDark ? '#6B7280' : '#9CA3AF' },
                  ]}
                >
                  Submit Feedback
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Privacy Note */}
          <Text
            style={[
              styles.privacyNote,
              { color: isDark ? '#6B7280' : '#9CA3AF' },
            ]}
          >
            Your feedback is anonymous and helps keep our community safe
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  feedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  feedbackEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  feedbackDescription: {
    fontSize: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});

export default CommunicationFeedbackModal;
