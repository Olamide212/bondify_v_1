// import { useRouter } from 'expo-router';
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useTheme } from '../../../../context/ThemeContext';

// const MapWebFallback = () => {
//   const router = useRouter();
//   const { colors } = useTheme();

//   return (
//     <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }] }>
//       <StatusBar style="dark" />
//       <View style={styles.contentWrap}>
//         <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }] }>
//           <Text style={[styles.eyebrow, { color: colors.textSecondary }] }>
//             Maps are mobile-first
//           </Text>
//           <Text style={[styles.title, { color: colors.textPrimary }] }>
//             The interactive map is not supported on the web build yet.
//           </Text>
//           <Text style={[styles.body, { color: colors.textSecondary }] }>
//             Please open Bondify on iOS or Android to explore nearby members,
//             or continue browsing other tabs here on the web.
//           </Text>
//           <TouchableOpacity
//             style={[styles.button, { backgroundColor: colors.primary || '#E8651A' }] }
//             onPress={() => router.push('/(root)/(discover)/profiles')}
//           >
//             <Text style={styles.buttonText}>Go back to Discover</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: { flex: 1 },
//   contentWrap: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 24,
//   },
//   card: {
//     width: '100%',
//     maxWidth: 460,
//     borderRadius: 24,
//     padding: 28,
//     borderWidth: 1,
//     gap: 12,
//   },
//   eyebrow: {
//     fontSize: 13,
//     letterSpacing: 1,
//     textTransform: 'uppercase',
//     fontFamily: 'PlusJakartaSansBold',
//   },
//   title: {
//     fontSize: 22,
//     lineHeight: 30,
//     fontFamily: 'PlusJakartaSansBold',
//   },
//   body: {
//     fontSize: 15,
//     lineHeight: 22,
//     fontFamily: 'PlusJakartaSans',
//   },
//   button: {
//     marginTop: 8,
//     borderRadius: 999,
//     paddingVertical: 14,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 15,
//     fontFamily: 'PlusJakartaSansBold',
//   },
// });

// export default MapWebFallback;
