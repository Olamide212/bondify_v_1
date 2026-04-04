// import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
// import { Pause, Play } from 'lucide-react-native';
// import { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Animated,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { colors } from '../../constant/colors';

// // ─── Audio mode ─────────────────────────────────────────
// const ensureAudioMode = async () => {
//   await setAudioModeAsync({
//     playsInSilentMode:         true,   // ← must be true before player is created
//     shouldPlayInBackground:    false,
//     interruptionMode:          'mixWithOthers',
//     allowsRecording:           false,
//     allowsBackgroundRecording: false,
//     shouldDuckAndroid:         false,
//   });
// };

// // ─── Expanded waveform ──────────────────────────────────

// const MiniWaveform = ({ isActive }) => {
//   const bars = useRef(
//     Array.from({ length: 32 }, () => new Animated.Value(0.35))
//   ).current;

//   useEffect(() => {
//     let anims;

//     if (isActive) {
//       anims = bars.map((bar, i) =>
//         Animated.loop(
//           Animated.sequence([
//             Animated.timing(bar, {
//               toValue: 0.25 + Math.random() * 1,
//               duration: 150 + i * 15,
//               useNativeDriver: true,
//             }),
//             Animated.timing(bar, {
//               toValue: 0.25,
//               duration: 150 + i * 15,
//               useNativeDriver: true,
//             }),
//           ])
//         )
//       );
//       anims.forEach((a) => a.start());
//     } else {
//       bars.forEach((bar) =>
//         Animated.timing(bar, {
//           toValue: 0.35,
//           duration: 200,
//           useNativeDriver: true,
//         }).start()
//       );
//     }

//     return () => anims?.forEach((a) => a.stop());
//   }, [isActive]);

//   return (
//     <View style={wv.row}>
//       {bars.map((bar, i) => (
//         <Animated.View
//           key={i}
//           style={[wv.bar, { transform: [{ scaleY: bar }] }]}
//         />
//       ))}
//     </View>
//   );
// };

// const wv = StyleSheet.create({
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: 3,
//     height: 24,
//   },
//   bar: {
//     width: 3,
//     height: 18,
//     borderRadius: 2,
//     backgroundColor: '#121212',
//   },
// });

// // ─── Voice Prompt Button ─────────────────────────────────

// const VoicePromptButton = ({ uri }) => {
//   const [phase, setPhase] = useState('idle');
//   const playerRef = useRef(null);

//   // ── Release player on unmount or when uri changes ────────────────────────
//   useEffect(() => {
//     return () => releasePlayer();
//   }, []);

//   useEffect(() => {
//     // If the URI changes while playing, stop and reset
//     releasePlayer();
//     setPhase('idle');
//   }, [uri]);

//   const releasePlayer = () => {
//     if (playerRef.current) {
//       try { playerRef.current.pause();   } catch {}
//       try { playerRef.current.release(); } catch {}  // ← release(), not remove()
//       playerRef.current = null;
//     }
//   };

//   const handlePress = async () => {
//     if (!uri) return;

//     // ── Pause ──────────────────────────────────────────────────────────────
//     if (phase === 'playing') {
//       try { playerRef.current?.pause(); } catch {}
//       setPhase('paused');
//       return;
//     }

//     // ── Resume ─────────────────────────────────────────────────────────────
//     if (phase === 'paused') {
//       try { playerRef.current?.play(); } catch {}
//       setPhase('playing');
//       return;
//     }

//     // ── Start fresh playback ───────────────────────────────────────────────
//     setPhase('loading');

//     try {
//       // Set audio mode BEFORE creating the player — iOS needs playsInSilentMode
//       // to be active at player-creation time, not just before play()
//       await ensureAudioMode();

//       // Release any leftover player first
//       releasePlayer();

//       // SDK 53: always pass { uri } object, never a bare string
//       const uriSource = typeof uri === 'string' ? { uri } : uri;
//       const player = createAudioPlayer(uriSource);
//       playerRef.current = player;

//       player.addListener('playbackStatusUpdate', (status) => {
//         // Guard: listener fires before native player is ready (isLoaded=false),
//         // reading fields at that point causes silent failures on some devices
//         if (!status.isLoaded) return;

//         if (status.didJustFinish) {
//           setPhase('idle');
//           try { player.seekTo(0); } catch {}
//           // Defer release so the native finish event fully propagates first
//           setTimeout(() => {
//             try { player.release(); } catch {}
//             if (playerRef.current === player) playerRef.current = null;
//           }, 200);
//         }
//       });

//       // addListener must be registered before play() so we never miss
//       // the first status update
//       player.play();
//       setPhase('playing');
//     } catch (err) {
//       console.error('[VoicePromptButton] playback error:', err);
//       setPhase('idle');
//     }
//   };

//   const isPlaying = phase === 'playing';
//   const isLoading = phase === 'loading';

//   return (
//     <TouchableOpacity
//       onPress={handlePress}
//       activeOpacity={0.85}
//       style={vp.container}
//     >
//       <View style={vp.iconCircle}>
//         {isLoading ? (
//           <ActivityIndicator size="small" color={colors.primary} />
//         ) : isPlaying ? (
//           <Pause size={16} color={colors.primary} strokeWidth={2.5} />
//         ) : (
//           <Play size={16} color={colors.primary} strokeWidth={2.5} />
//         )}
//       </View>

//       <MiniWaveform isActive={isPlaying} />
//     </TouchableOpacity>
//   );
// };

// const vp = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//     width: '100%',
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.25)',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 40,
//   },
//   iconCircle: {
//     width: 34,
//     height: 34,
//     borderRadius: 20,
//     backgroundColor: '#121212',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

// export default VoicePromptButton;




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
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../constant/colors';

// ─── Audio mode ──────────────────────────────────────────────────────────────
const ensureAudioMode = async () => {
  await setAudioModeAsync({
    playsInSilentMode:         true,
    shouldPlayInBackground:    false,
    interruptionMode:          'mixWithOthers',
    allowsRecording:           false,
    allowsBackgroundRecording: false,
    shouldDuckAndroid:         false,
  });
};

// ─── Curvy waveform SVG ───────────────────────────────────────────────────────
// Generates a smooth sine-like path across the full width.
// `progress` (0–1) determines how far the "played" highlight extends.

const buildWavePath = (width, height) => {
  const midY    = height / 2;
  const step    = width / 48;       // number of wave segments
  const amp     = height * 0.38;    // peak amplitude

  // We use a cubic Bézier pattern that produces a smooth sine-like curve.
  // Each segment: M/L to anchor, then C for the curves.
  let d = `M 0 ${midY}`;
  for (let i = 0; i < 48; i++) {
    const x0 = i * step;
    const x1 = (i + 0.5) * step;
    const x2 = (i + 1)   * step;
    // Alternate up/down peaks
    const peak = i % 2 === 0 ? midY - amp : midY + amp;
    d += ` C ${x0 + step * 0.25} ${midY}, ${x1 - step * 0.1} ${peak}, ${x1} ${peak}`;
    d += ` C ${x1 + step * 0.1} ${peak}, ${x2 - step * 0.25} ${midY}, ${x2} ${midY}`;
  }
  return d;
};

const WaveformSvg = ({ width, height, progress, color, dimColor }) => {
  const path = buildWavePath(width, height);

  return (
    <Svg width={width} height={height} style={{ position: 'absolute' }}>
      {/* Dim (unplayed) layer — full width */}
      <Path
        d={path}
        stroke={dimColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Bright (played) layer — clipped by progress */}
      {progress > 0 && (
        <Path
          d={path}
          stroke={color}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${width * progress} ${width}`}
          strokeDashoffset={0}
        />
      )}
    </Svg>
  );
};

// ─── Animated waveform (idle/playing state) ───────────────────────────────────
// When playing, gently pulses the amplitude via Animated.
const AnimatedWaveform = ({ isPlaying, progress, waveWidth, waveHeight, color, dimColor }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop;
    if (isPlaying) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.82, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
    return () => loop?.stop();
  }, [isPlaying]);

  return (
    <Animated.View
      style={{
        width: waveWidth,
        height: waveHeight,
        transform: [{ scaleY: pulseAnim }],
      }}
    >
      <WaveformSvg
        width={waveWidth}
        height={waveHeight}
        progress={progress}
        color={color}
        dimColor={dimColor}
      />
    </Animated.View>
  );
};

// ─── Voice Prompt Button ──────────────────────────────────────────────────────

const WAVE_HEIGHT = 48;

const VoicePromptButton = ({ uri, tint = '#fff' }) => {
  const [phase,       setPhase]       = useState('idle');
  const [playPos,     setPlayPos]     = useState(0);
  const [playDur,     setPlayDur]     = useState(0);
  const playerRef = useRef(null);

  // Container width — measured via onLayout
  const [containerW, setContainerW] = useState(260);
  // Width available for waveform (total - button - gaps)
  const BUTTON_SIZE = 52;
  const GAP         = 16;
  const waveWidth   = Math.max(containerW - BUTTON_SIZE - GAP * 2, 80);

  const progress = playDur > 0 ? Math.min(playPos / playDur, 1) : 0;

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => releasePlayer(), []);
  useEffect(() => { releasePlayer(); setPhase('idle'); setPlayPos(0); setPlayDur(0); }, [uri]);

  const releasePlayer = () => {
    if (playerRef.current) {
      try { playerRef.current.pause();   } catch {}
      try { playerRef.current.release(); } catch {}
      playerRef.current = null;
    }
  };

  // ── Press handler ─────────────────────────────────────────────────────────
  const handlePress = async () => {
    if (!uri) return;

    if (phase === 'playing') {
      try { playerRef.current?.pause(); } catch {}
      setPhase('paused');
      return;
    }
    if (phase === 'paused') {
      try { playerRef.current?.play(); } catch {}
      setPhase('playing');
      return;
    }

    setPhase('loading');
    try {
      await ensureAudioMode();
      releasePlayer();

      const src = typeof uri === 'string' ? { uri } : uri;
      const player = createAudioPlayer(src);
      playerRef.current = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (!status.isLoaded) return;
        if (typeof status.currentTime === 'number') setPlayPos(status.currentTime);
        if (typeof status.duration    === 'number' && status.duration > 0) setPlayDur(status.duration);
        if (status.didJustFinish) {
          setPhase('idle');
          setPlayPos(0);
          try { player.seekTo(0); } catch {}
          setTimeout(() => {
            try { player.release(); } catch {}
            if (playerRef.current === player) playerRef.current = null;
          }, 200);
        }
      });

      player.play();
      setPhase('playing');
    } catch (err) {
      console.error('[VoicePromptButton] error:', err);
      setPhase('idle');
    }
  };

  const isPlaying = phase === 'playing';
  const isLoading = phase === 'loading';

  // Waveform colors
  const waveColor    = tint;
  const waveDimColor = `${tint}40`;  // 25% opacity of tint

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.88}
      style={s.container}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      {/* ── Left waveform half ── */}
      <View style={[s.waveHalf, { width: waveWidth / 2 }]} pointerEvents="none">
        <AnimatedWaveform
          isPlaying={isPlaying}
          progress={progress * 2}          // left half shows first 50%
          waveWidth={waveWidth / 2}
          waveHeight={WAVE_HEIGHT}
          color={waveColor}
          dimColor={waveDimColor}
        />
      </View>

      {/* ── Centre button ── */}
      <View style={s.btnWrap}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: tint }]}
          onPress={handlePress}
          activeOpacity={0.82}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : isPlaying ? (
            <Pause size={20} color={colors.primary} strokeWidth={2.5} />
          ) : (
            <Play size={20} color={colors.primary} strokeWidth={2.5} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Right waveform half ── */}
      <View style={[s.waveHalf, { width: waveWidth / 2 }]} pointerEvents="none">
        <AnimatedWaveform
          isPlaying={isPlaying}
          progress={Math.max(0, progress * 2 - 1)}   // right half shows last 50%
          waveWidth={waveWidth / 2}
          waveHeight={WAVE_HEIGHT}
          color={waveColor}
          dimColor={waveDimColor}
        />
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    width:           '100%',
    paddingHorizontal: 16,
    paddingVertical:   14,
    backgroundColor: 'rgba(0,0,0,0.50)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
    borderRadius:    50,
    gap:             0,
    overflow:        'hidden',
  },
  waveHalf: {
    alignItems:  'center',
    justifyContent: 'center',
    height:      WAVE_HEIGHT,
    overflow:    'hidden',
  },
  btnWrap: {
    width:          52,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         2,
    marginHorizontal: 4,
  },
  btn: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.18,
    shadowRadius:   6,
    elevation:      4,
  },
});

export default VoicePromptButton;