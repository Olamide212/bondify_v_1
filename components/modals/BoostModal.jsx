import { Zap } from 'lucide-react-native';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constant/colors';
import BaseModal from './BaseModal';

const BoostModal = ({ visible, onClose, onBoost, isLoading = false }) => {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Zap size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Boost Your Profile</Text>

        <Text style={styles.description}>
          Get more visibility and matches by boosting your profile! You can boost up to 3 times per day. Your profile will be shown to more people for the next 24 hours.
        </Text>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <Text style={styles.benefit}>• 10x more profile views</Text>
          <Text style={styles.benefit}>• Higher match chances</Text>
          <Text style={styles.benefit}>• Priority in discovery</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.boostButton, isLoading && styles.disabledButton]}
            onPress={onBoost}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Zap size={20} color="#fff" />
                <Text style={styles.boostButtonText}>Boost Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSansBold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
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
    fontFamily: 'PlusJakartaSansBold',
    color: '#000',
    marginBottom: 8,
  },
  benefit: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans',
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#374151',
  },
  boostButton: {
    backgroundColor: colors.primary,
  },
  boostButtonText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BoostModal;