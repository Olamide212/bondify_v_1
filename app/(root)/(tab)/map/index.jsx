import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../../context/ThemeContext';

const MapScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
      <StatusBar style="dark" />
      <View style={styles.contentWrap}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }] }>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }] }>
            Maps are mobile-first
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }] }>
            The interactive map is not supported on the web build yet.
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }] }>
            Please open Bondify on iOS or Android to explore nearby members,
            or continue browsing other tabs here on the web.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary || '#E8651A' }] }
            onPress={() => router.push('/(root)/(tab)/discover')}
          >
            <Text style={styles.buttonText}>Go back to Discover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapScreen;