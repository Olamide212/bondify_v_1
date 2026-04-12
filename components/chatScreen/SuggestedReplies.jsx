/**
 * SuggestedReplies.jsx
 *
 * Displays AI-generated reply suggestions in a horizontal scroll.
 * Appears above the chat input when the last message is from the other person.
 */

import { Sparkles } from 'lucide-react-native';
import { memo, useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constant/colors';
import AIService from '../../services/aiService';

const SuggestedReplies = memo(({
  matchId,
  lastMessage,
  conversationContext = [],
  onSelectSuggestion,
  visible = true,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Fetch suggestions when lastMessage changes
  useEffect(() => {
    if (!matchId || !lastMessage || !visible) {
      setSuggestions([]);
      return;
    }

    // Reset dismissed state when new message arrives
    setDismissed(false);

    let cancelled = false;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await AIService.suggestReplies(
          matchId,
          lastMessage,
          conversationContext.slice(-6) // Send last 6 messages for context
        );

        if (!cancelled && result?.suggestions?.length > 0) {
          setSuggestions(result.suggestions);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[SuggestedReplies] Failed to fetch:', err.message);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce to avoid rapid API calls
    const timeoutId = setTimeout(fetchSuggestions, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [matchId, lastMessage, visible]);

  const handleSelect = useCallback(
    (suggestion) => {
      onSelectSuggestion?.(suggestion);
      setDismissed(true); // Hide after selection
    },
    [onSelectSuggestion]
  );

  // Don't render if no suggestions, dismissed, or not visible
  if (!visible || dismissed || (suggestions.length === 0 && !loading)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={styles.loadingText}>AI is thinking...</Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.aiLabel}>
            <Sparkles size={12} color={colors.primary} />
          </View>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`suggestion-${index}`}
              style={styles.suggestionChip}
              onPress={() => handleSelect(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText} numberOfLines={2}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

SuggestedReplies.displayName = 'SuggestedReplies';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSansMedium',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 8,
  },
  aiLabel: {
    backgroundColor: 'rgba(255, 75, 146, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 4,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: 200,
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 18,
  },
});

export default SuggestedReplies;
