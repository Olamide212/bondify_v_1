/**
 * VoicePrompt.js — expo-audio rewrite (SDK 53+)
 *
 * Migration from expo-av:
 *  - Audio.Recording  → useAudioRecorder + useAudioRecorderState
 *  - Audio.Sound      → useAudioPlayer + useAudioPlayerStatus
 *  - Audio.setAudioModeAsync({ playsInSilentModeIOS }) → setAudioModeAsync({ playsInSilentMode })
 *  - AudioModule.requestRecordingPermissionsAsync() replaces Audio.requestPermissionsAsync()
 *  - expo-audio does NOT auto-reset position after finish — seekTo(0) before replay
 *  - No manual cleanup needed for hooks; useAudioPlayer/useAudioRecorder manage lifecycle
 */

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
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
const BAR_COUNT      = 28;

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
    Array.from({ length: BAR_COUNT }, () => ({
      anim:   new Animated.Value(0.15 + Math.random() * 0.5),
      height: 8 + Math.random() * 36,
    }))
  ).current;

  useEffect(() => {
    let anims;
    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar.anim, { toValue: 0.3 + Math.random() * 0.7, duration: 150 + i * 20, useNativeDriver: true }),
            Animated.timing(bar.anim, { toValue: 0.15, duration: 150 + i * 20, useNativeDriver: true }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.spring(bar.anim, { toValue: 1, useNativeDriver: true, bounciness: 2 }).start()
      );
    }
    return () => anims?.forEach((a) => a.stop());
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const filledCount = Math.round(progress * BAR_COUNT);

  return (
    <View style={wv.row}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            wv.bar,
            {
              height:          bar.height,
              backgroundColor: i < filledCount ? '#E8651A' : '#F5C4A8',
              transform:       [{ scaleY: bar.anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 52, justifyContent: 'center' },
  bar: { width: 3.5, borderRadius: 3 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoicePrompt({ profile, onUpdateField }) {
  const { colors } = useTheme();

  // phase: 'idle' | 'recording' | 'recorded' | 'playing' | 'paused' | 'uploading'
  const [phase,       setPhase]       = useState('idle');
  const [recordUri,   setRecordUri]   = useState(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPT_QUESTIONS.length));

  // ── expo-audio: recorder ──────────────────────────────────────────────────
  const audioRecorder   = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState   = useAudioRecorderState(audioRecorder);

  // ── expo-audio: player ────────────────────────────────────────────────────
  // useAudioPlayer accepts null — it will simply not load anything
  const player       = useAudioPlayer(recordUri ? { uri: recordUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // Seed from existing profile voice prompt
  useEffect(() => {
    if (profile?.voicePrompt) {
      const uri =
        typeof profile.voicePrompt === 'string'
          ? profile.voicePrompt
          : profile.voicePrompt?.url || profile.voicePrompt?.uri || null;
      if (uri) {
        setRecordUri(uri);
        setHasExisting(true);
        setPhase('recorded');
      }
    }
  }, [profile?.voicePrompt]);

  // Sync phase when player finishes
  useEffect(() => {
    if (playerStatus.didJustFinish) {
      // expo-audio does not auto-reset — seek to 0 so replay works
      player.seekTo(0);
      setPhase('recorded');
    }
  }, [playerStatus.didJustFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  // Request mic permission on mount
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().catch(() => {});
  }, []);

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Enable microphone access to record a voice prompt.');
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase('recording');
    } catch (err) {
      console.error('[VoicePrompt] startRecording error:', err);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;

      // Switch mode back to playback
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

      if (!tempUri) { setPhase('idle'); return; }

      // Copy to permanent cache dir — the temp URI loses permissions after the
      // recording session closes on iOS (AVAudioRecorder error -1102)
      const fileName = `voice_prompt_${Date.now()}.m4a`;
      const destFile = new File(Paths.cache, fileName);
      await new File(tempUri).copy(destFile);

      setRecordUri(destFile.uri);
      setHasExisting(false);
      setPhase('recorded');
    } catch (err) {
      console.error('[VoicePrompt] stopRecording error:', err);
      Alert.alert('Error', 'Could not save recording. Please try again.');
      setPhase('idle');
    }
  };

  // ── Playback ──────────────────────────────────────────────────────────────

  const startPlayback = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.seekTo(0);
      player.play();
      setPhase('playing');
    } catch (err) {
      console.error('[VoicePrompt] startPlayback error:', err);
      setPhase('recorded');
    }
  };

  const pausePlayback = () => {
    player.pause();
    setPhase('paused');
  };

  const resumePlayback = () => {
    player.play();
    setPhase('playing');
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert('Delete voice prompt', 'Remove your voice prompt from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          player.pause();
          setRecordUri(null);
          setPhase('idle');
          setHasExisting(false);
          onUpdateField?.('voicePrompt', null);
        },
      },
    ]);
  };

  // ── Re-record ─────────────────────────────────────────────────────────────

  const handleReRecord = () => {
    player.pause();
    setRecordUri(null);
    setPhase('idle');
    setHasExisting(false);
  };

  // ── Save / Upload ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!recordUri) return;
    setPhase('uploading');
    try {
      await onUpdateField?.('voicePrompt', recordUri);
      setHasExisting(true);
      setPhase('recorded');
      Alert.alert('Saved! 🎉', 'Your voice prompt has been added to your profile.');
    } catch (err) {
      console.error('[VoicePrompt] upload error:', err);
      Alert.alert('Error', 'Failed to save voice prompt. Please try again.');
      setPhase('recorded');
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isRecording  = phase === 'recording';
  const isPlaying    = phase === 'playing';
  const isUploading  = phase === 'uploading';
  const hasRecording = !!recordUri && ['recorded', 'playing', 'paused', 'uploading'].includes(phase);

  // Duration numbers for display
  // recorderState.durationMillis is live during recording
  // playerStatus.duration / currentTime are live during playback
  const recDurationS  = Math.floor((recorderState.durationMillis ?? 0) / 1000);
  const playDurationS = Math.round(playerStatus.duration ?? 0);
  const playPosS      = Math.round(playerStatus.currentTime ?? 0);

  const totalSeconds = isRecording
    ? MAX_DURATION_S
    : isPlaying || phase === 'paused'
      ? (playDurationS || MAX_DURATION_S)
      : (recDurationS || MAX_DURATION_S);

  const currentPos = isRecording
    ? recDurationS
    : isPlaying || phase === 'paused'
      ? playPosS
      : 0;

  const progress  = totalSeconds > 0 ? Math.min(currentPos / totalSeconds, 1) : 0;
  const leftTime  = fmt(currentPos);
  const rightTime = fmt(totalSeconds);

  // Auto-stop at max duration
  useEffect(() => {
    if (isRecording && recDurationS >= MAX_DURATION_S) {
      stopRecording();
    }
  }, [recDurationS, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

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

          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View style={s.timeRow}>
            <Text style={s.timeLabel}>{leftTime}</Text>
            <Text style={s.timeLabel}>{rightTime}</Text>
          </View>
        </View>

        {/* Controls row */}
        <View style={s.controls}>

          {/* Trash */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: hasRecording ? colors.background : 'transparent', opacity: hasRecording ? 1 : 0.3 }]}
            onPress={hasRecording ? handleDelete : undefined}
            disabled={!hasRecording || isUploading}
          >
            <Trash2 size={19} color={hasRecording ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Main play/stop button */}
          <TouchableOpacity
            style={[
              s.mainBtn,
              isRecording  && { backgroundColor: '#EF4444' },
              isUploading  && { backgroundColor: '#F5A878' },
            ]}
            onPress={() => {
              if (isRecording)        stopRecording();
              else if (isPlaying)     pausePlayback();
              else if (phase === 'paused') resumePlayback();
              else if (hasRecording)  startPlayback();
              else                    startRecording();
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

          {/* Re-record */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: hasRecording ? colors.background : 'transparent', opacity: hasRecording ? 1 : 0.3 }]}
            onPress={hasRecording ? handleReRecord : undefined}
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

        {/* Save button */}
        {hasRecording && !hasExisting && !isUploading && (
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.86}>
            <Upload size={15} color="#fff" strokeWidth={2} />
            <Text style={s.saveBtnText}>Save to profile</Text>
          </TouchableOpacity>
        )}

        {isUploading && (
          <View style={s.uploadingRow}>
            <ActivityIndicator size="small" color="#E8651A" />
            <Text style={[s.statusText, { color: colors.textSecondary, marginTop: 0 }]}>
              Saving to your profile…
            </Text>
          </View>
        )}
      </View>

      {/* ── "Add another one" teaser ── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontSize: 11, fontFamily: 'PlusJakartaSansBold', color: '#E8651A', letterSpacing: 1.2 },

  promptText: { fontSize: 22, fontFamily: 'PlusJakartaSansBold', lineHeight: 30 },

  waveBox: {
    backgroundColor: '#FFF4EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },

  progressTrack: { height: 3, backgroundColor: '#FDDCC8', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: 3, backgroundColor: '#E8651A', borderRadius: 2 },

  timeRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  timeLabel: { fontSize: 11, fontFamily: 'PlusJakartaSansMedium', color: '#9CA3AF' },

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

  statusText: { fontSize: 12, fontFamily: 'PlusJakartaSans', textAlign: 'center', marginTop: -4 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22C55E',
    borderRadius: 50,
    paddingVertical: 13,
    marginTop: 2,
  },
  saveBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

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