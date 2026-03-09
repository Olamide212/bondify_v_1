/**
 * VoicePrompt.js
 *
 * Allows users to record a short voice prompt (≤ 60 seconds) for their profile.
 * Uses expo-av for recording/playback.
 *
 * Props:
 *  profile         — current profile object (reads profile.voicePrompt)
 *  onUpdateField   — async (field, value) => void  — called with ('voicePrompt', uri)
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const MAX_DURATION_S = 60;

// ─── tiny waveform bars ───────────────────────────────────────────────────────

const Waveform = ({ isActive, color }) => {
  const bars = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    let anims;
    if (isActive) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.2 + Math.random() * 0.8,
              duration: 200 + i * 30,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.2,
              duration: 200 + i * 30,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.timing(bar, { toValue: 0.3, duration: 200, useNativeDriver: true }).start()
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
            { backgroundColor: color, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 40 },
  bar: { width: 3, height: 28, borderRadius: 2 },
});

// ─── format seconds ───────────────────────────────────────────────────────────

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ─── main component ───────────────────────────────────────────────────────────

export default function VoicePrompt({ profile, onUpdateField }) {
  const { colors } = useTheme();

  const [phase, setPhase]           = useState('idle'); // idle | recording | recorded | playing | uploading
  const [duration, setDuration]     = useState(0);   // recorded seconds
  const [playPos, setPlayPos]       = useState(0);   // playback position seconds
  const [recordUri, setRecordUri]   = useState(null);
  const [hasExisting, setHasExisting] = useState(false);

  const recordingRef  = useRef(null);
  const soundRef      = useRef(null);
  const timerRef      = useRef(null);
  const playTimerRef  = useRef(null);

  // seed existing voice prompt
  useEffect(() => {
    if (profile?.voicePrompt) {
      setHasExisting(true);
      setRecordUri(profile.voicePrompt);
      setPhase('recorded');
    }
  }, [profile?.voicePrompt]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(playTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── recording ──────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable microphone access to record a voice prompt.');
        return;
      }

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
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI();
      recordingRef.current = null;
      setRecordUri(uri);
      setPhase('recorded');
      setHasExisting(false);

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) {
      console.error('Stop recording error:', err);
    }
  };

  // ── playback ────────────────────────────────────────────────

  const startPlayback = async () => {
    try {
      if (!recordUri) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPhase('playing');
      setPlayPos(0);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlayPos(Math.floor((status.positionMillis ?? 0) / 1000));
          if (status.didJustFinish) {
            setPhase('recorded');
            setPlayPos(0);
          }
        }
      });
    } catch (err) {
      console.error('Playback error:', err);
      Alert.alert('Error', 'Could not play audio.');
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

  // ── delete ──────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert(
      'Delete voice prompt',
      'Remove your voice prompt from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await soundRef.current?.unloadAsync().catch(() => {});
            soundRef.current = null;
            setRecordUri(null);
            setPhase('idle');
            setDuration(0);
            setHasExisting(false);
            onUpdateField?.('voicePrompt', null);
          },
        },
      ]
    );
  };

  // ── upload ──────────────────────────────────────────────────

  const handleSave = async () => {
    if (!recordUri) return;
    setPhase('uploading');
    try {
      await onUpdateField?.('voicePrompt', recordUri);
      setHasExisting(true);
      setPhase('recorded');
      Alert.alert('Saved', 'Your voice prompt has been saved!');
    } catch (err) {
      console.error('Voice upload error:', err);
      Alert.alert('Error', 'Failed to save voice prompt.');
      setPhase('recorded');
    }
  };

  // ── render ──────────────────────────────────────────────────

  const isRecording = phase === 'recording';
  const isPlaying   = phase === 'playing';
  const isUploading = phase === 'uploading';
  const hasRecording = !!recordUri && (phase === 'recorded' || phase === 'playing' || phase === 'uploading');

  const timeDisplay = isPlaying ? fmt(playPos) : fmt(duration);
  const timeMax     = isPlaying ? fmt(duration || MAX_DURATION_S) : fmt(MAX_DURATION_S);

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={[s.iconCircle, { backgroundColor: '#FFF4EE' }]}>
          <Mic size={18} color="#E8651A" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Voice Prompt</Text>
          <Text style={[s.cardSub, { color: colors.textSecondary }]}>
            {hasExisting ? 'Tap play to hear your prompt' : 'Record up to 60 seconds'}
          </Text>
        </View>
        {hasRecording && (
          <TouchableOpacity onPress={handleDelete} style={s.trashBtn} disabled={isUploading}>
            <Trash2 size={16} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Waveform + time */}
      <View style={s.waveRow}>
        <Waveform
          isActive={isRecording || isPlaying}
          color={isRecording ? '#EF4444' : '#6366F1'}
        />
        <Text style={[s.timeText, { color: colors.textSecondary }]}>
          {timeDisplay} / {timeMax}
        </Text>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        {/* Record / Stop */}
        {!hasRecording && (
          <TouchableOpacity
            style={[
              s.mainBtn,
              isRecording
                ? { backgroundColor: '#EF4444' }
                : { backgroundColor: '#E8651A' },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.86}
          >
            {isRecording ? (
              <Square size={20} color="#fff" strokeWidth={2.5} />
            ) : (
              <Mic size={20} color="#fff" strokeWidth={2} />
            )}
            <Text style={s.mainBtnText}>
              {isRecording ? 'Stop' : 'Record'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Play / Pause */}
        {hasRecording && (
          <TouchableOpacity
            style={[s.mainBtn, { backgroundColor: '#6366F1' }]}
            onPress={isPlaying ? pausePlayback : startPlayback}
            disabled={isUploading}
            activeOpacity={0.86}
          >
            {isPlaying ? (
              <Pause size={20} color="#fff" strokeWidth={2.5} />
            ) : (
              <Play size={20} color="#fff" strokeWidth={2.5} />
            )}
            <Text style={s.mainBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>
        )}

        {/* Re-record */}
        {hasRecording && !isUploading && (
          <TouchableOpacity
            style={[s.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => {
              soundRef.current?.unloadAsync().catch(() => {});
              soundRef.current = null;
              setRecordUri(null);
              setPhase('idle');
              setDuration(0);
            }}
            activeOpacity={0.82}
          >
            <MicOff size={16} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[s.secondaryBtnText, { color: colors.textSecondary }]}>Re-record</Text>
          </TouchableOpacity>
        )}

        {/* Save — only show if unsaved local recording */}
        {hasRecording && !hasExisting && !isUploading && (
          <TouchableOpacity
            style={[s.saveBtn]}
            onPress={handleSave}
            activeOpacity={0.86}
          >
            <Upload size={16} color="#fff" strokeWidth={2} />
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>
        )}

        {/* Uploading spinner */}
        {isUploading && (
          <View style={s.uploadingRow}>
            <ActivityIndicator size="small" color="#E8651A" />
            <Text style={[s.uploadingText, { color: colors.textSecondary }]}>Saving…</Text>
          </View>
        )}
      </View>

      {/* Hint */}
      {!hasRecording && !isRecording && (
        <Text style={[s.hint, { color: colors.textSecondary }]}>
          🎙 Give people a taste of your personality — talk about anything!
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle:   { fontSize: 15, fontFamily: 'PlusJakartaSansBold' },
  cardSub:     { fontSize: 12, fontFamily: 'PlusJakartaSans', marginTop: 1 },
  trashBtn:    { padding: 6 },

  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeText: { fontFamily: 'PlusJakartaSansMedium', fontSize: 12 },

  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  mainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50,
  },
  mainBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 14 },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 50,
    borderWidth: 1,
  },
  secondaryBtnText: { fontFamily: 'PlusJakartaSansMedium', fontSize: 13 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 50,
    backgroundColor: '#22C55E',
  },
  saveBtnText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: 13 },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadingText: { fontFamily: 'PlusJakartaSans', fontSize: 13 },

  hint: { fontSize: 12, fontFamily: 'PlusJakartaSans', lineHeight: 18 },
});