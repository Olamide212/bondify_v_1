/**
 * VoicePromptButton.jsx
 *
 * Standalone component used in discovery cards for voice prompt playback.
 * 
 * Uses useAudioPlayer hook with the URI passed as a prop. The hook handles
 * lifecycle automatically, so no manual cleanup is needed. Since we always
 * have a valid URI before rendering this component, the Android SDK 53
 * null-crash doesn't occur.
 */

import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
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

// ─── Audio mode — set once per app session ────────────────────────────────────
const ensureAudioMode = async () => {
  const audioConfig = {
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
    allowsRecording: false,
    allowsBackgroundRecording: false,
    shouldDuckAndroid: false,
  };
  console.log('[VoicePromptButton] setAudioModeAsync', audioConfig);
  await setAudioModeAsync(audioConfig);
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

  // Create player using the hook with the passed URI
  const playbackPlayer = useAudioPlayer(uri);

  const handlePress = async () => {
    console.log('[VoicePromptButton] handlePress called, phase:', phase, 'uri:', uri);
    if (!uri) return;

    // ── Pause ──────────────────────────────────────────────────────────────
    if (phase === 'playing') {
      try {
        playbackPlayer?.pause();
        setPhase('paused');
      } catch { setPhase('idle'); }
      return;
    }

    // ── Resume ─────────────────────────────────────────────────────────────
    if (phase === 'paused') {
      try {
        playbackPlayer?.play();
        setPhase('playing');
      } catch { setPhase('idle'); }
      return;
    }

    // ── Load + Play ────────────────────────────────────────────────────────
    setPhase('loading');
    try {
      // Ensure silent-mode is enabled BEFORE playing
      await ensureAudioMode();

      // Ensure the source is set on the player
      console.log('[VoicePromptButton] calling playbackPlayer.replace() with uri:', uri);
      await playbackPlayer.replace(uri);
      console.log('[VoicePromptButton] replace() completed');
      
      // Wait a moment for the file to start loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[VoicePromptButton] currentStatus after replace():', {
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        duration: playbackPlayer.duration,
        playing: playbackPlayer.playing,
      });

      console.log('[VoicePromptButton] calling playbackPlayer.play()');
      await playbackPlayer.play();
      console.log('[VoicePromptButton] playbackPlayer.play() completed');
      
      console.log('[VoicePromptButton] currentStatus after play():', {
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        duration: playbackPlayer.duration,
        playing: playbackPlayer.playing,
      });
      
      setPhase('playing');
    } catch (err) {
      console.warn('[VoicePromptButton] play error:', err?.message);
      setPhase('idle');
    }
  };

  const isPlaying = phase === 'playing';
  const isLoading = phase === 'loading';

  // ── Monitor playback status ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const statusInterval = setInterval(() => {
      console.log('[VoicePromptButton] playback status:', {
        currentTime: playbackPlayer.currentTime,
        duration: playbackPlayer.duration,
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        playing: playbackPlayer.playing,
      });
      
      // Auto-stop when finished
      if (playbackPlayer.currentTime >= playbackPlayer.duration && playbackPlayer.duration > 0) {
        console.log('[VoicePromptButton] playback finished');
        setPhase('idle');
        try { playbackPlayer.seekTo(0); } catch {}
      }
    }, 100);
    
    return () => clearInterval(statusInterval);
  }, [phase, playbackPlayer]);

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