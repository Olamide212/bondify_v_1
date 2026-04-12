/**
 * CommunicationBadge Component
 * 
 * Displays a user's communication score level as a badge.
 * Can be used in chat headers, profile cards, etc.
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SCORE_LEVELS } from '../../services/communicationService';

const CommunicationBadge = ({
  level = 'new',
  score,
  size = 'medium', // 'small', 'medium', 'large'
  showLabel = true,
  showTooltip = false,
  onPress,
  style,
}) => {
  const levelInfo = SCORE_LEVELS[level] || SCORE_LEVELS.new;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
          emoji: { fontSize: 10 },
          label: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
          emoji: { fontSize: 18 },
          label: { fontSize: 14 },
        };
      default: // medium
        return {
          container: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
          emoji: { fontSize: 12 },
          label: { fontSize: 12 },
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: levelInfo.bgColor },
        style,
      ]}
    >
      <Text style={[styles.emoji, sizeStyles.emoji]}>
        {levelInfo.emoji}
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            sizeStyles.label,
            { color: levelInfo.color },
          ]}
        >
          {levelInfo.label}
        </Text>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    // fontSize set by sizeStyles
  },
  label: {
    fontWeight: '600',
    // fontSize and color set by sizeStyles
  },
});

export default CommunicationBadge;
