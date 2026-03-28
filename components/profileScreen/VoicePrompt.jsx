/**
 * VoicePrompt.js — expo-audio SDK 53, createAudioPlayer edition
 */

import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system/next';
import { Mic, Pause, Play, RefreshCw, Square, Trash2, Upload } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../../constant/colors';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';

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

const ensureAudioMode = async (allowsRecording = false) => {
  await setAudioModeAsync({
    playsInSilentMode:         true,
    shouldPlayInBackground:    false,
    interruptionMode:          'mixWithOthers',
    allowsRecording,
    allowsBackgroundRecording: false,
    shouldDuckAndroid:         false,
  });
};

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
            Animated.timing(bar.anim, { toValue: 0.15,                       duration: 150 + i * 20, useNativeDriver: true }),
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
          style={[wv.bar, {
            height:          bar.height,
            backgroundColor: i < filledCount ? colors.secondary : '#fff',
            transform:       [{ scaleY: bar.anim }],
          }]}
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
  const { colors }   = useTheme();
  const { showAlert } = useAlert();

  // phase: 'idle' | 'recording' | 'recorded' | 'playing' | 'paused' | 'uploading'
  const [phase,        setPhase]        = useState('idle');
  const [recordUri,    setRecordUri]    = useState(null);
  const [hasExisting,  setHasExisting]  = useState(false);
  const [playPos,      setPlayPos]      = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [promptIndex]  = useState(() => Math.floor(Math.random() * PROMPT_QUESTIONS.length));

  // Tracks the local cache URI after recording so the profile seed
  // useEffect never overwrites it with the remote URL after saving.
  const localUriRef = useRef(null);

  // ── expo-audio ────────────────────────────────────────────────────────────
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recDurationS  = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  const playerRef = useRef(null);

  // ── Seed from existing profile voice prompt ───────────────────────────────
  // Guard: if we already have a freshly recorded local file, don't overwrite
  // it with the remote URL that comes back after onUpdateField triggers a
  // profile refresh.
  useEffect(() => {
    if (profile?.voicePrompt) {
      if (localUriRef.current) return; // local recording takes priority

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

  // ── Request mic permission on mount ──────────────────────────────────────
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().catch(() => {});
  }, []);

  // ── Cleanup player on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  // ── Auto-stop recording at max duration ───────────────────────────────────
  useEffect(() => {
    if (phase === 'recording' && recDurationS >= MAX_DURATION_S) {
      stopRecording();
    }
  }, [recDurationS, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        showAlert({ icon: 'mic', title: 'Permission needed', message: 'Enable microphone access to record a voice prompt.' });
        return;
      }
      await ensureAudioMode(true);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase('recording');
    } catch (err) {
      console.error('[VoicePrompt] startRecording error:', err);
      showAlert({ icon: 'error', title: 'Error', message: 'Could not start recording.' });
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;

      await ensureAudioMode(false);

      if (!tempUri) { setPhase('idle'); return; }

      const fileName = `voice_prompt_${Date.now()}.m4a`;
      const destFile = new File(Paths.cache, fileName);
      await new File(tempUri).copy(destFile);

      // Store in ref so the profile seed effect won't clobber this URI
      localUriRef.current = destFile.uri;

      setRecordUri(destFile.uri);
      setHasExisting(false);
      setPhase('recorded');
    } catch (err) {
      console.error('[VoicePrompt] stopRecording error:', err);
      showAlert({ icon: 'error', title: 'Error', message: 'Could not save recording. Please try again.' });
      setPhase('idle');
    }
  };

  // ── Playback ──────────────────────────────────────────────────────────────

  const startPlayback = async () => {
    if (!recordUri) return;
    try {
      await ensureAudioMode(false);

      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = createAudioPlayer({ uri: recordUri });
      playerRef.current = player;

      player.addListener('playbackStatusUpdate', (status) => {
        // Surface errors that were previously swallowed silently
        if (status.error) {
          console.error('[VoicePrompt] playback error:', status.error);
          showAlert({ icon: 'error', title: 'Playback failed', message: 'Could not play this recording.' });
          setPhase('recorded');
          setPlayPos(0);
          player.removeAllListeners('playbackStatusUpdate');
          player.remove();
          playerRef.current = null;
          return;
        }

        if (!status.isLoaded) return;
        if (status.currentTime !== undefined) setPlayPos(Math.round(status.currentTime));
        if (status.duration !== undefined && !isNaN(status.duration)) setPlayDuration(Math.round(status.duration));

        if (status.didJustFinish) {
          setPhase('recorded');
          setPlayPos(0);
          player.removeAllListeners('playbackStatusUpdate');
          player.seekTo(0);
          player.remove();
          playerRef.current = null;
        }
      });

      player.play();
      setPhase('playing');
    } catch (err) {
      console.error('[VoicePrompt] startPlayback error:', err);
      showAlert({ icon: 'error', title: 'Playback failed', message: 'Could not play this recording.' });
      setPhase('recorded');
    }
  };

  const pausePlayback = () => {
    playerRef.current?.pause();
    setPhase('paused');
  };

  const resumePlayback = () => {
    playerRef.current?.play();
    setPhase('playing');
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    showAlert({
      icon:    'delete',
      title:   'Delete voice prompt',
      message: 'Remove your voice prompt from your profile?',
      actions: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Delete', style: 'destructive',
          onPress: () => {
            if (playerRef.current) {
              playerRef.current.removeAllListeners('playbackStatusUpdate');
              playerRef.current.remove();
              playerRef.current = null;
            }
            localUriRef.current = null; // clear local ref so seed effect works again
            setRecordUri(null);
            setPhase('idle');
            setHasExisting(false);
            onUpdateField?.('voicePrompt', null);
          },
        },
      ],
    });
  };

  // ── Re-record ─────────────────────────────────────────────────────────────

  const handleReRecord = () => {
    if (playerRef.current) {
      playerRef.current.removeAllListeners('playbackStatusUpdate');
      playerRef.current.remove();
      playerRef.current = null;
    }
    localUriRef.current = null; // clear so seed effect can work on next mount
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
      // recordUri intentionally stays as the local cache file so playback
      // keeps working immediately after save. localUriRef.current stays set
      // so the profile seed useEffect won't overwrite it with the remote URL.
      setHasExisting(true);
      setPhase('recorded');
      showAlert({ icon: 'success', title: 'Saved! 🎉', message: 'Your voice prompt has been added to your profile.' });
    } catch (err) {
      console.error('[VoicePrompt] upload error:', err);
      showAlert({ icon: 'error', title: 'Error', message: 'Failed to save voice prompt. Please try again.' });
      setPhase('recorded');
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isRecording  = phase === 'recording';
  const isPlaying    = phase === 'playing';
  const isUploading  = phase === 'uploading';
  const hasRecording = !!recordUri && ['recorded', 'playing', 'paused', 'uploading'].includes(phase);

  const totalSeconds = isRecording
    ? MAX_DURATION_S
    : (isPlaying || phase === 'paused') && playDuration > 0
      ? playDuration
      : MAX_DURATION_S;

  const currentPos = isRecording
    ? recDurationS
    : (isPlaying || phase === 'paused')
      ? playPos
      : 0;

  const progress = totalSeconds > 0 ? Math.min(currentPos / totalSeconds, 1) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.outer}>
      <View style={[s.card, { backgroundColor: colors.surface }]}>

        <View style={s.labelRow}>
          <Mic size={13} color={colors.primary} strokeWidth={2.5} />
          <Text style={s.labelText}>VOICE PROMPT</Text>
        </View>

        <Text style={[s.promptText, { color: colors.textPrimary }]}>
          {PROMPT_QUESTIONS[promptIndex]}
        </Text>

        <View style={s.waveBox}>
          <Waveform isActive={isRecording || isPlaying} progress={progress} />
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={s.timeRow}>
            <Text style={s.timeLabel}>{fmt(currentPos)}</Text>
            <Text style={s.timeLabel}>{fmt(totalSeconds)}</Text>
          </View>
        </View>

        <View style={s.controls}>
          {/* Trash */}
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: hasRecording ? colors.background : 'transparent', opacity: hasRecording ? 1 : 0.3 }]}
            onPress={hasRecording ? handleDelete : undefined}
            disabled={!hasRecording || isUploading}
          >
            <Trash2 size={19} color={hasRecording ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Main button */}
          <TouchableOpacity
            style={[
              s.mainBtn,
              isRecording && { backgroundColor: '#EF4444' },
              isUploading && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              if (isRecording)             stopRecording();
              else if (isPlaying)          pausePlayback();
              else if (phase === 'paused') resumePlayback();
              else if (hasRecording)       startPlayback();
              else                         startRecording();
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

        {isRecording && (
          <Text style={[s.statusText, { color: '#EF4444' }]}>● Recording…</Text>
        )}
        {!hasRecording && !isRecording && (
          <Text style={[s.statusText, { color: colors.textSecondary }]}>Tap the button to start recording</Text>
        )}

        {hasRecording && !hasExisting && !isUploading && (
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.86}>
            <Upload size={15} color="#fff" strokeWidth={2} />
            <Text style={s.saveBtnText}>Save to profile</Text>
          </TouchableOpacity>
        )}

        {isUploading && (
          <View style={s.uploadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[s.statusText, { color: colors.textSecondary, marginTop: 0 }]}>Saving to your profile…</Text>
          </View>
        )}

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer:        { paddingHorizontal: 16, gap: 12 },
  card:         { borderRadius: 22, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  labelRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText:    { fontSize: 11, fontFamily: 'PlusJakartaSansBold', color: colors.primary, letterSpacing: 1.2 },
  promptText:   { fontSize: 22, fontFamily: 'PlusJakartaSansBold', lineHeight: 30 },
  waveBox:      { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, gap: 10 },
  progressTrack:{ height: 3, backgroundColor: colors.secondary, borderRadius: 2, overflow: 'hidden', opacity: 0.3 },
  progressFill: { height: 3, backgroundColor: colors.secondary, borderRadius: 2 },
  timeRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  timeLabel:    { fontSize: 11, fontFamily: 'PlusJakartaSansMedium', color: colors.secondary },
  controls:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 4 },
  iconBtn:      { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  mainBtn:      { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 12, elevation: 8 },
  statusText:   { fontSize: 12, fontFamily: 'PlusJakartaSans', textAlign: 'center', marginTop: -4 },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 13, marginTop: 2 },
  saveBtnText:  { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});