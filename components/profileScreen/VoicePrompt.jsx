/**
 * VoicePrompt.js — expo-audio SDK 53, createAudioPlayer edition
 *
 * Why createAudioPlayer instead of useAudioPlayer:
 * ─────────────────────────────────────────────────
 * useAudioPlayer(source) initialises the native player immediately. When
 * `recordUri` is null (pre-recording) this crashes on Android. When
 * `recordUri` changes (after a new recording is saved) the hook does NOT
 * reinitialise with the new source — the user would have to re-mount the
 * component to pick up the new file.
 *
 * createAudioPlayer() gives us explicit control:
 *   - create on demand, only when the user taps Play
 *   - pass the exact URI we have at that moment
 *   - release cleanly when done / on unmount
 *
 * Recording still uses useAudioRecorder (hook is fine there — it doesn't
 * need a source at init time).
 */

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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

// ─── Audio mode — set once, lazily ───────────────────────────────────────────
const ensureAudioMode = async (allowsRecording = false) => {
  const audioConfig = {
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
    allowsRecording,
    allowsBackgroundRecording: false,
    shouldDuckAndroid: false,
  };
  console.log('[VoicePrompt] setAudioModeAsync', audioConfig);
  await setAudioModeAsync(audioConfig);
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
          style={[wv.bar, {
            height:          bar.height,
            backgroundColor: i < filledCount ? '#E8651A' : '#F5C4A8',
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
  const { colors } = useTheme();

  // phase: 'idle' | 'recording' | 'recorded' | 'playing' | 'paused' | 'uploading'
  const [phase,        setPhase]        = useState('idle');
  const [recordUri,    setRecordUri]    = useState(null);
  const [hasExisting,  setHasExisting]  = useState(false);
  const [playPos,      setPlayPos]      = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [promptIndex]  = useState(() => Math.floor(Math.random() * PROMPT_QUESTIONS.length));

  // ── expo-audio: recorder (hook is fine here — no source needed at init) ───
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recDurationS  = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  // ── expo-audio: playback player ───────────────────────────────────────────
  // Using useAudioPlayer with the recordUri when available
  // The hook manages its own lifecycle, no manual cleanup needed
  const playbackPlayer = useAudioPlayer(recordUri || undefined);

  // ── Seed from existing profile voice prompt ───────────────────────────────
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

  // ── Request mic permission on mount ──────────────────────────────────────
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().catch(() => {});
  }, []);

  // useAudioPlayer manages its own lifecycle, no manual cleanup needed

  // ── Monitor playback status continuously ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    
    const statusInterval = setInterval(() => {
      console.log('[VoicePrompt] playback status:', {
        currentTime: playbackPlayer.currentTime,
        duration: playbackPlayer.duration,
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        playing: playbackPlayer.playing,
      });
      
      if (playbackPlayer.currentTime !== undefined) {
        setPlayPos(Math.round(playbackPlayer.currentTime));
      }
      if (playbackPlayer.duration !== undefined && !isNaN(playbackPlayer.duration)) {
        setPlayDuration(Math.round(playbackPlayer.duration));
      }
    }, 100);
    
    return () => clearInterval(statusInterval);
  }, [phase, playbackPlayer]);

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
        Alert.alert('Permission needed', 'Enable microphone access to record a voice prompt.');
        return;
      }
      await ensureAudioMode(true); // allowsRecording = true
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

      await ensureAudioMode(false); // back to playback mode

      if (!tempUri) { setPhase('idle'); return; }

      // Copy to permanent cache dir — temp URI loses read permissions on iOS
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
    if (!recordUri) return;
    try {
      console.log('[VoicePrompt] startPlayback entering with recordUri:', recordUri);
      await ensureAudioMode(false);
      
      // CRITICAL: Use replace() to set the audio source on the player
      // The hook was initialized with undefined, so we must explicitly set the source
      console.log('[VoicePrompt] calling playbackPlayer.replace() with URI:', recordUri);
      await playbackPlayer.replace(recordUri);
      console.log('[VoicePrompt] replace() completed');
      
      // Wait a moment for the file to start loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[VoicePrompt] currentStatus after replace():', {
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        duration: playbackPlayer.duration,
        playing: playbackPlayer.playing,
      });

      console.log('[VoicePrompt] calling playbackPlayer.play()');
      await playbackPlayer.play();
      console.log('[VoicePrompt] playbackPlayer.play() completed');
      
      // Check status after play
      console.log('[VoicePrompt] currentStatus after play():', {
        isLoaded: playbackPlayer.isLoaded,
        isBuffering: playbackPlayer.isBuffering,
        duration: playbackPlayer.duration,
        playing: playbackPlayer.playing,
      });
      
      setPhase('playing');
    } catch (err) {
      console.error('[VoicePrompt] startPlayback error:', err);
      Alert.alert('Playback error', 'Could not play the recording. Please try again.');
      setPhase('recorded');
    }
  };

  const pausePlayback = () => {
    try { playbackPlayer?.pause(); } catch {}
    setPhase('paused');
  };

  const resumePlayback = () => {
    try { playbackPlayer?.play(); } catch {}
    setPhase('playing');
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert('Delete voice prompt', 'Remove your voice prompt from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          setRecordUri(null);
          setPhase('idle');
          setHasExisting(false);
          onUpdateField?.('voicePrompt', null);
        },
      },
    ]);
  };

  const handleReRecord = () => {
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

  const totalSeconds = isRecording
    ? MAX_DURATION_S
    : (isPlaying || phase === 'paused') && playDuration > 0
      ? playDuration
      : MAX_DURATION_S;

  const currentPos = isRecording ? recDurationS
    : (isPlaying || phase === 'paused') ? playPos
    : 0;

  const progress  = totalSeconds > 0 ? Math.min(currentPos / totalSeconds, 1) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.outer}>
      <View style={[s.card, { backgroundColor: colors.surface }]}>

        <View style={s.labelRow}>
          <Mic size={13} color="#E8651A" strokeWidth={2.5} />
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
            style={[s.mainBtn, isRecording && { backgroundColor: '#EF4444' }, isUploading && { backgroundColor: '#F5A878' }]}
            onPress={() => {
              if (isRecording)           stopRecording();
              else if (isPlaying)        pausePlayback();
              else if (phase === 'paused') resumePlayback();
              else if (hasRecording)     startPlayback();
              else                       startRecording();
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

        {isRecording && <Text style={[s.statusText, { color: '#EF4444' }]}>● Recording…</Text>}
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
            <ActivityIndicator size="small" color="#E8651A" />
            <Text style={[s.statusText, { color: colors.textSecondary, marginTop: 0 }]}>Saving to your profile…</Text>
          </View>
        )}
      </View>

      {/* "Add another one" teaser */}
      <View style={[s.teaserCard, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.teaserLabel, { color: colors.textSecondary }]}>Add another one</Text>
          <Text style={[s.teaserPrompt, { color: colors.textPrimary }]}>&quot;My secret talent is…&quot;</Text>
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
  card: { borderRadius: 22, padding: 20, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontSize: 11, fontFamily: 'PlusJakartaSansBold', color: '#E8651A', letterSpacing: 1.2 },
  promptText: { fontSize: 22, fontFamily: 'PlusJakartaSansBold', lineHeight: 30 },
  waveBox: { backgroundColor: '#FFF4EE', borderRadius: 14, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, gap: 10 },
  progressTrack: { height: 3, backgroundColor: '#FDDCC8', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#E8651A', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeLabel: { fontSize: 11, fontFamily: 'PlusJakartaSansMedium', color: '#9CA3AF' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 4 },
  iconBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  mainBtn: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8651A', shadowColor: '#E8651A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.38, shadowRadius: 12, elevation: 8 },
  statusText: { fontSize: 12, fontFamily: 'PlusJakartaSans', textAlign: 'center', marginTop: -4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#22C55E', borderRadius: 50, paddingVertical: 13, marginTop: 2 },
  saveBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  teaserCard: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: '#F3F4F6', borderStyle: 'dashed' },
  teaserLabel: { fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#9CA3AF', marginBottom: 3 },
  teaserPrompt: { fontSize: 16, fontFamily: 'PlusJakartaSansBold' },
  teaserBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#E8651A', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 50 },
  teaserBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 13 },
});