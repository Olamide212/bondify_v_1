import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constant/colors';

// ─── Audio mode ─────────────────────────────────────────
const ensureAudioMode = async () => {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });
};

// ─── Expanded waveform ──────────────────────────────────

const MiniWaveform = ({ isActive }) => {
  const bars = useRef(
    Array.from({ length: 32 }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    let anims;

    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.25 + Math.random() * 1,
              duration: 150 + i * 15,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.25,
              duration: 150 + i * 15,
              useNativeDriver: true,
            }),
          ])
        )
      );

      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.timing(bar, {
          toValue: 0.35,
          duration: 200,
          useNativeDriver: true,
        }).start()
      );
    }

    return () => anims?.forEach((a) => a.stop());
  }, [isActive]);

  return (
    <View style={wv.row}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            wv.bar,
            {
              transform: [{ scaleY: bar }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 3,
    height: 24,
  },
  bar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});

// ─── Voice Prompt Button ─────────────────────────────────

const VoicePromptButton = ({ uri }) => {
  const [phase, setPhase] = useState('idle');
  const playerRef = useRef(null);

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

    if (phase === 'playing') {
      playerRef.current?.pause();
      setPhase('paused');
      return;
    }

    if (phase === 'paused') {
      playerRef.current?.play();
      setPhase('playing');
      return;
    }

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
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={vp.container}
    >
      <View style={vp.iconCircle}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isPlaying ? (
          <Pause size={16} color={colors.primary} strokeWidth={2.5} />
        ) : (
          <Play size={16} color={colors.primary} strokeWidth={2.5} />
        )}
      </View>

      <MiniWaveform isActive={isPlaying} />
    </TouchableOpacity>
  );
};

const vp = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,

    width: '100%',

    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',

    paddingHorizontal: 16,
    paddingVertical: 12,

    borderRadius: 40,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 20,
    backgroundColor: '#fff',

    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoicePromptButton;