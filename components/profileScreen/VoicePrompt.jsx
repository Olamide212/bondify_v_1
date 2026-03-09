/**
 * VoicePrompt.js
 *
 * Redesigned to match the reference UI:
 *  - Orange "VOICE PROMPT" label with mic icon
 *  - Bold italic prompt question
 *  - Waveform bars in a warm tinted box
 *  - Progress bar + timestamps
 *  - Icon-only controls: trash | big orange play/pause | re-record
 *  - "Add another one" teaser card (second prompt slot, future feature)
 *
 * Playback fix:
 *  - Audio.setAudioModeAsync called BEFORE creating the sound (not after)
 *  - durationMillis tracked from onPlaybackStatusUpdate
 *  - Recording URI passed correctly with { uri } wrapper
 */

import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system/next';
import { Mic, Pause, Play, RefreshCw, Square, Trash2, Upload } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width: SW } = Dimensions.get('window');
const MAX_DURATION_S = 60;
const BAR_COUNT = 28;

const PROMPT_QUESTIONS = [
  '"A song I can\'t stop listening to lately…"',
  '"My most controversial food opinion is…"',
  '"You\'ll know I like you when…"',
  '"The most spontaneous thing I\'ve done is…"',
  '"My love language is…"',
  '"I\'m weirdly passionate about…"',
];

const fmt = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ─── Waveform ─────────────────────────────────────────────────────────────────

const Waveform = ({ isActive, progress = 0 }) => {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, (_, i) => ({
      anim:   new Animated.Value(0.15 + Math.random() * 0.5),
      height: 8 + Math.random() * 36, // static bar heights for "fingerprint" look
    }))
  ).current;

  useEffect(() => {
    let anims;
    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar.anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 150 + i * 20,
              useNativeDriver: true,
            }),
            Animated.timing(bar.anim, {
              toValue: 0.15,
              duration: 150 + i * 20,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.spring(bar.anim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 2,
        }).start()
      );
    }
    return () => anims?.forEach((a) => a.stop());
  }, [isActive]);

  const filledCount = Math.round(progress * BAR_COUNT);

  return (
    <View style={wv.row}>
      {bars.map((bar, i) => {
        const filled = i < filledCount;
        return (
          <Animated.View
            key={i}
            style={[
              wv.bar,
              {
                height: bar.height,
                backgroundColor: filled ? '#E8651A' : '#F5C4A8',
                transform: [{ scaleY: bar.anim }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const wv = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 52,
    justifyContent: 'center',
  },
  bar: { width: 3.5, borderRadius: 3 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoicePrompt({ profile, onUpdateField }) {
  const { colors } = useTheme();

  const [phase, setPhase]           = useState('idle'); // idle | recording | recorded | playing | uploading
  const [duration, setDuration]     = useState(0);
  const [playPos, setPlayPos]       = useState(0);
  const [playDuration, setPlayDuration] = useState(0); // actual audio duration from AV
  const [recordUri, setRecordUri]   = useState(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [promptIndex]               = useState(() => Math.floor(Math.random() * PROMPT_QUESTIONS.length));

  const recordingRef = useRef(null);
  const soundRef     = useRef(null);
  const timerRef     = useRef(null);

  // seed existing voice prompt
  useEffect(() => {
    if (profile?.voicePrompt) {
      setHasExisting(true);
      setRecordUri(profile.voicePrompt);
      setPhase('recorded');
    }
  }, [profile?.voicePrompt]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Recording ──────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable microphone access to record a voice prompt.');
        return;
      }

      // Must set BEFORE creating recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setPhase('recording');
      setDuration(0);
      setPlayPos(0);
      setPlayDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION_S) {
            stopRecording();
            return MAX_DURATION_S;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      clearInterval(timerRef.current);

      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const tempUri = rec.getURI();
      recordingRef.current = null;

      // Switch audio mode back to playback BEFORE anything else
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      if (!tempUri) return;

      // ── Key fix: copy from AVAudioRecorder's temp location to the app's
      //    permanent cache dir. iOS error -1102 happens because the original
      //    temp URI loses read permissions once the recording session closes.
      const fileName = `voice_prompt_${Date.now()}.m4a`;
      const destFile = new File(Paths.cache, fileName);

      const srcFile = new File(tempUri);
      await srcFile.copy(destFile);

      setRecordUri(destFile.uri);
      setHasExisting(false);
      setPhase('recorded');
    } catch (err) {
      console.error('Stop recording error:', err);
      Alert.alert('Error', 'Could not save recording. Please try again.');
    }
  };

  // ── Playback (FIXED) ────────────────────────────────────────

  const startPlayback = async () => {
    try {
      if (!recordUri) return;

      // For local recordings: verify the file actually exists before loading
      // (skipped for remote S3 URLs which start with http)
      if (!recordUri.startsWith('http')) {
        const file = new File(recordUri);
        if (!file.exists) {
          Alert.alert(
            'File not found',
            'The recording could not be found. Please record again.'
          );
          setPhase('idle');
          setRecordUri(null);
          return;
        }
      }

      // Always set playback audio mode BEFORE creating the sound object
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Unload any stale sound object
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: recordUri },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );

      soundRef.current = sound;
      setPhase('playing');
      setPlayPos(0);

      if (status?.durationMillis) {
        setPlayDuration(Math.floor(status.durationMillis / 1000));
      }

      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;

        if (s.durationMillis && s.durationMillis > 0) {
          setPlayDuration(Math.floor(s.durationMillis / 1000));
        }

        setPlayPos(Math.floor((s.positionMillis ?? 0) / 1000));

        if (s.didJustFinish) {
          setPhase('recorded');
          setPlayPos(0);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.error('Playback error:', err);
      Alert.alert('Playback error', 'Could not play the recording. Please try recording again.');
      setPhase('recorded');
    }
  };

  const pausePlayback = async () => {
    try {
      await soundRef.current?.pauseAsync();
      setPhase('recorded');
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  // ── Delete ──────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert('Delete voice prompt', 'Remove your voice prompt from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          setRecordUri(null);
          setPhase('idle');
          setDuration(0);
          setPlayPos(0);
          setPlayDuration(0);
          setHasExisting(false);
          onUpdateField?.('voicePrompt', null);
        },
      },
    ]);
  };

  // ── Save / Upload ───────────────────────────────────────────

  const handleSave = async () => {
    if (!recordUri) return;
    setPhase('uploading');
    try {
      await onUpdateField?.('voicePrompt', recordUri);
      setHasExisting(true);
      setPhase('recorded');
      Alert.alert('Saved! 🎉', 'Your voice prompt has been added to your profile.');
    } catch (err) {
      console.error('Voice upload error:', err);
      Alert.alert('Error', 'Failed to save voice prompt. Please try again.');
      setPhase('recorded');
    }
  };

  // ── Derived state ───────────────────────────────────────────

  const isRecording  = phase === 'recording';
  const isPlaying    = phase === 'playing';
  const isUploading  = phase === 'uploading';
  const hasRecording = !!recordUri && ['recorded', 'playing', 'uploading'].includes(phase);

  // Progress 0–1 for the waveform fill and bar
  const totalSeconds = isPlaying
    ? (playDuration || duration || MAX_DURATION_S)
    : (duration || MAX_DURATION_S);
  const currentPos   = isPlaying ? playPos : (isRecording ? duration : 0);
  const progress     = totalSeconds > 0 ? Math.min(currentPos / totalSeconds, 1) : 0;

  const leftTime  = fmt(currentPos);
  const rightTime = fmt(totalSeconds);

  // ── Render ──────────────────────────────────────────────────

  return (
    <View style={s.outer}>
      {/* ── Main card ── */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>

        {/* Orange "VOICE PROMPT" label */}
        <View style={s.labelRow}>
          <Mic size={13} color="#E8651A" strokeWidth={2.5} />
          <Text style={s.labelText}>VOICE PROMPT</Text>
        </View>

        {/* Prompt question */}
        <Text style={[s.promptText, { color: colors.textPrimary }]}>
          {PROMPT_QUESTIONS[promptIndex]}
        </Text>

        {/* Waveform box */}
        <View style={s.waveBox}>
          <Waveform isActive={isRecording || isPlaying} progress={progress} />

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          {/* Timestamps */}
          <View style={s.timeRow}>
            <Text style={s.timeLabel}>{leftTime}</Text>
            <Text style={s.timeLabel}>{rightTime}</Text>
          </View>
        </View>

        {/* Controls row */}
        <View style={s.controls}>
          {/* Trash — only when there's a recording */}
          <TouchableOpacity
            style={[
              s.iconBtn,
              { backgroundColor: hasRecording ? colors.background : 'transparent', opacity: hasRecording ? 1 : 0.3 },
            ]}
            onPress={hasRecording ? handleDelete : undefined}
            disabled={!hasRecording || isUploading}
          >
            <Trash2 size={19} color={hasRecording ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Main centre button */}
          <TouchableOpacity
            style={[
              s.mainBtn,
              isRecording && { backgroundColor: '#EF4444' },
              isUploading && { backgroundColor: '#F5A878' },
            ]}
            onPress={() => {
              if (isRecording)       stopRecording();
              else if (isPlaying)    pausePlayback();
              else if (hasRecording) startPlayback();
              else                   startRecording();
            }}
            disabled={isUploading}
            activeOpacity={0.86}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isRecording ? (
              <Square size={22} color="#fff" strokeWidth={2.5} />
            ) : isPlaying ? (
              <Pause size={22} color="#fff" strokeWidth={2.5} />
            ) : (
              <Play size={22} color="#fff" strokeWidth={2.5} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          {/* Re-record / rotate — visible when recording exists */}
          <TouchableOpacity
            style={[
              s.iconBtn,
              { backgroundColor: hasRecording ? colors.background : 'transparent', opacity: hasRecording ? 1 : 0.3 },
            ]}
            onPress={hasRecording ? () => {
              soundRef.current?.unloadAsync().catch(() => {});
              soundRef.current = null;
              setRecordUri(null);
              setPhase('idle');
              setDuration(0);
              setPlayPos(0);
              setPlayDuration(0);
              setHasExisting(false);
            } : undefined}
            disabled={!hasRecording || isUploading}
          >
            <RefreshCw size={19} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Status text */}
        {isRecording && (
          <Text style={[s.statusText, { color: '#EF4444' }]}>● Recording…</Text>
        )}
        {!hasRecording && !isRecording && (
          <Text style={[s.statusText, { color: colors.textSecondary }]}>
            Tap the button to start recording
          </Text>
        )}

        {/* Save button — unsaved local recording only */}
        {hasRecording && !hasExisting && !isUploading && (
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.86}>
            <Upload size={15} color="#fff" strokeWidth={2} />
            <Text style={s.saveBtnText}>Save to profile</Text>
          </TouchableOpacity>
        )}

        {isUploading && (
          <View style={s.uploadingRow}>
            <ActivityIndicator size="small" color="#E8651A" />
            <Text style={[s.statusText, { color: colors.textSecondary, marginTop: 0 }]}>Saving to your profile…</Text>
          </View>
        )}
      </View>

      {/* ── "Add another one" teaser (disabled — future feature) ── */}
      <View style={[s.teaserCard, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.teaserLabel, { color: colors.textSecondary }]}>Add another one</Text>
          <Text style={[s.teaserPrompt, { color: colors.textPrimary }]}>
            &quot;My secret talent is…&quot;
          </Text>
        </View>
        <TouchableOpacity
          style={s.teaserBtn}
          onPress={() => Alert.alert('Coming soon', 'Multiple voice prompts are coming in a future update!')}
          activeOpacity={0.86}
        >
          <Mic size={14} color="#fff" strokeWidth={2} />
          <Text style={s.teaserBtnText}>Record</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { paddingHorizontal: 16, gap: 12 },

  card: {
    borderRadius: 22,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Label
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontSize: 11, fontFamily: 'PlusJakartaSansBold', color: '#E8651A', letterSpacing: 1.2 },

  // Prompt text
  promptText: { fontSize: 22, fontFamily: 'PlusJakartaSansBold', lineHeight: 30 },

  // Waveform box
  waveBox: {
    backgroundColor: '#FFF4EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },

  // Progress
  progressTrack: {
    height: 3,
    backgroundColor: '#FDDCC8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#E8651A',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: { fontSize: 11, fontFamily: 'PlusJakartaSansMedium', color: '#9CA3AF' },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 4,
  },
  iconBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  mainBtn: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8651A',
    shadowColor: '#E8651A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },

  statusText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans',
    textAlign: 'center',
    marginTop: -4,
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22C55E',
    borderRadius: 50,
    paddingVertical: 13,
    marginTop: 2,
  },
  saveBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  // Teaser card
  teaserCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  teaserLabel:   { fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#9CA3AF', marginBottom: 3 },
  teaserPrompt:  { fontSize: 16, fontFamily: 'PlusJakartaSansBold' },
  teaserBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#E8651A',
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 50,
  },
  teaserBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 13 },
});