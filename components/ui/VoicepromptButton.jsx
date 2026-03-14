/**
 * VoicePromptButton.jsx
 *
 * Standalone component used in discovery cards for voice prompt playback.
 *
 * Uses createAudioPlayer for on-demand imperative control: create on tap,
 * release when done or on unmount.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constant/colors';

// ─── Audio mode ───────────────────────────────────────────────────────────────
const ensureAudioMode = async () => {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
    allowsRecording: false,
    allowsBackgroundRecording: false,
    shouldDuckAndroid: false,
  });
};

// ─── Mini waveform ────────────────────────────────────────────────────────────

const MiniWaveform = ({ isActive }) => {
  const bars = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    let anims;
    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 0.3 + Math.random() * 0.7, duration: 170 + i * 55, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.25, duration: 170 + i * 55, useNativeDriver: true }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.timing(bar, { toValue: 0.35, duration: 180, useNativeDriver: true }).start()
      );
    }
    return () => anims?.forEach((a) => a.stop());
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={wv.row}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[wv.bar, { transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  bar: { width: 3, height: 18, borderRadius: 2, backgroundColor: '#fff' },
});

// ─── VoicePromptButton ────────────────────────────────────────────────────────

const VoicePromptButton = ({ uri }) => {
  // phase: 'idle' | 'loading' | 'playing' | 'paused'
  const [phase, setPhase] = useState('idle');
  const playerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const handlePress = async () => {
    if (!uri) return;

    // ── Pause ──────────────────────────────────────────────────────────────
    if (phase === 'playing') {
      playerRef.current?.pause();
      setPhase('paused');
      return;
    }

    // ── Resume ─────────────────────────────────────────────────────────────
    if (phase === 'paused') {
      playerRef.current?.play();
      setPhase('playing');
      return;
    }

    // ── Load + Play ────────────────────────────────────────────────────────
    setPhase('loading');
    try {
      await ensureAudioMode();

      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = createAudioPlayer({ uri });
      playerRef.current = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setPhase('idle');
          player.removeAllListeners('playbackStatusUpdate');
          player.seekTo(0);
        }
      });

      player.play();
      setPhase('playing');
    } catch {
      setPhase('idle');
    }
  };

  const isPlaying = phase === 'playing';
  const isLoading = phase === 'loading';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.82} style={vp.pill}>
      <View style={vp.iconCircle}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isPlaying ? (
          <Pause size={14} color={colors.primary} strokeWidth={2.5} />
        ) : (
          <Play size={14} color={colors.primary} strokeWidth={2.5} />
        )}
      </View>

      <MiniWaveform isActive={isPlaying} />

      <Text style={vp.label}>
        {isPlaying ? 'Playing…' : phase === 'paused' ? 'Paused' : 'Voice prompt'}
      </Text>
    </TouchableOpacity>
  );
};

const vp = StyleSheet.create({
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   'rgba(0,0,0,0.52)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:      99,
    alignSelf:         'flex-start',
  },
  iconCircle: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: '#fff',
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: { color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSansMedium' },
});

export default VoicePromptButton;