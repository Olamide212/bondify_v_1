/**
 * VoiceIntroScreen.js
 * Full-screen voice recording experience.
 * Communicates back to ProfileDetails via voiceIntroStore (module-level ref)
 * so we never serialize functions through Expo Router params.
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
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowUpCircle,
  ChevronLeft,
  Mic,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseModal from '../../../../components/modals/BaseModal';
import { colors } from '../../../../constant/colors';
import { useAlert } from '../../../../context/AlertContext';
import { useTheme } from '../../../../context/ThemeContext';
import { voiceIntroStore } from '../../../../store/voiceIntroStore';

const MAX_DURATION_S = 60;
const BAR_COUNT      = 40;

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
      anim:   new Animated.Value(0.15 + Math.random() * 0.4),
      height: 6 + Math.random() * 38,
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
              duration: 120 + i * 15,
              useNativeDriver: true,
            }),
            Animated.timing(bar.anim, {
              toValue: 0.1,
              duration: 120 + i * 15,
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
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            wv.bar,
            {
              height:          bar.height,
              backgroundColor: i < filledCount ? '#333' : '#D1D1D1',
              transform:       [{ scaleY: bar.anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const wv = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    height:            60,
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  bar: { width: 3, borderRadius: 2 },
});

// ─── Options Modal ────────────────────────────────────────────────────────────

const OptionsModal = ({ visible, onReplace, onDelete, onCancel }) => (
  <BaseModal visible={visible} onClose={onCancel}>
    <View style={om.content}>
      <View style={om.group}>
        <TouchableOpacity style={om.row} onPress={onReplace} activeOpacity={0.7}>
          <View style={om.iconWrap}>
            <ArrowUpCircle size={22} color="#111" strokeWidth={2} />
          </View>
          <Text style={om.rowText}>Replace intro</Text>
        </TouchableOpacity>

        <View style={om.divider} />

        <TouchableOpacity style={om.row} onPress={onDelete} activeOpacity={0.7}>
          <View style={om.iconWrap}>
            <Trash2 size={22} color="#111" strokeWidth={2} />
          </View>
          <Text style={om.rowText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={om.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
        <Text style={om.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </BaseModal>
);

const om = StyleSheet.create({
  content:    { paddingHorizontal: 6, paddingBottom: 10, gap: 10 },
  group:      {  borderRadius: 16, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 16 },
  iconWrap:   { width: 28, alignItems: 'center' },
  rowText:    { fontSize: 17, fontFamily: 'OutfitSemiBold', color: '#E5E5E5' },
  divider:    { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  cancelBtn:  {  borderRadius: 16, alignItems: 'center', paddingVertical: 18 },
  cancelText: { fontSize: 17, fontFamily: 'OutfitSemiBold', color: '#E5E5E5' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VoiceIntroScreen() {
  const router        = useRouter();
  const { colors }    = useTheme();
  const { showAlert } = useAlert();

  // phase: 'idle' | 'recording' | 'recorded' | 'playing' | 'paused' | 'uploading'
  const [phase,        setPhase]        = useState('idle');
  const [recordUri,    setRecordUri]    = useState(null);
  const [hasExisting,  setHasExisting]  = useState(false);
  const [playPos,      setPlayPos]      = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [showOptions,  setShowOptions]  = useState(false);

  // Keeps the local cache URI so profile re-seed never overwrites it
  const localUriRef = useRef(null);
  const playerRef   = useRef(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recDurationS  = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  // ── Mic permission ────────────────────────────────────────────────────────
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

  // ── Auto-stop at max duration ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'recording' && recDurationS >= MAX_DURATION_S) {
      stopRecording();
    }
  }, [recDurationS, phase]); // eslint-disable-line

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        showAlert({
          icon: 'mic', title: 'Permission needed',
          message: 'Enable microphone access in Settings.',
        });
        return;
      }
      await ensureAudioMode(true);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setPhase('recording');
    } catch (err) {
      console.error('[VoiceIntro] startRecording:', err);
      showAlert({ icon: 'error', title: 'Error', message: 'Could not start recording.' });
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;
      await ensureAudioMode(false);
      if (!tempUri) { setPhase('idle'); return; }

      const fileName = `voice_intro_${Date.now()}.m4a`;
      const destFile = new File(Paths.cache, fileName);
      await new File(tempUri).copy(destFile);

      // Pin local URI — this is what playback will always use after save
      localUriRef.current = destFile.uri;
      setRecordUri(destFile.uri);
      setHasExisting(false);
      setPhase('recorded');
    } catch (err) {
      console.error('[VoiceIntro] stopRecording:', err);
      showAlert({ icon: 'error', title: 'Error', message: 'Could not save recording.' });
      setPhase('idle');
    }
  };

  // ── Playback ──────────────────────────────────────────────────────────────

  const startPlayback = async () => {
    // Always use localUriRef if available — never the remote URL
    const uriToPlay = localUriRef.current ?? recordUri;
    if (!uriToPlay) return;

    try {
      await ensureAudioMode(false);

      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = createAudioPlayer({ uri: uriToPlay });
      playerRef.current = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.error) {
          console.error('[VoiceIntro] playback error:', status.error);
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
        if (status.duration !== undefined && !isNaN(status.duration))
          setPlayDuration(Math.round(status.duration));
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
      console.error('[VoiceIntro] startPlayback:', err);
      showAlert({ icon: 'error', title: 'Playback failed', message: 'Could not play this recording.' });
      setPhase('recorded');
    }
  };

  const pausePlayback  = () => { playerRef.current?.pause(); setPhase('paused'); };
  const resumePlayback = () => { playerRef.current?.play();  setPhase('playing'); };

  // ── Save ──────────────────────────────────────────────────────────────────

 const handleSave = async () => {
  if (!recordUri) return;
  setPhase('uploading');
  try {
    await voiceIntroStore.save(recordUri);
    setHasExisting(true);
    setPhase('recorded');
    // Route back immediately — ProfileDetails card will show the player
    router.back();
  } catch (err) {
    console.error('[VoiceIntro] save error:', err);
    showAlert({
      icon: 'error', title: 'Error',
      message: 'Failed to save. Please try again.',
    });
    setPhase('recorded');
  }
};

  // ── Options ───────────────────────────────────────────────────────────────

  const handleReplace = () => {
    setShowOptions(false);
    if (playerRef.current) {
      playerRef.current.removeAllListeners('playbackStatusUpdate');
      playerRef.current.remove();
      playerRef.current = null;
    }
    localUriRef.current = null;
    setRecordUri(null);
    setPhase('idle');
    setHasExisting(false);
    setPlayPos(0);
    setPlayDuration(0);
  };

  const handleDelete = () => {
    setShowOptions(false);
    showAlert({
      icon: 'delete', title: 'Delete voice intro',
      message: 'Remove your voice intro from your profile?',
      actions: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Delete', style: 'destructive',
          onPress: async () => {
            if (playerRef.current) {
              playerRef.current.removeAllListeners('playbackStatusUpdate');
              playerRef.current.remove();
              playerRef.current = null;
            }
            localUriRef.current = null;
            setRecordUri(null);
            setPhase('idle');
            setHasExisting(false);
            setPlayPos(0);
            setPlayDuration(0);
            try {
              await voiceIntroStore.delete();
            } catch (err) {
              console.error('[VoiceIntro] delete error:', err);
            }
          },
        },
      ],
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const isRecording  = phase === 'recording';
  const isPlaying    = phase === 'playing';
  const isUploading  = phase === 'uploading';
  const hasRecording = !!recordUri &&
    ['recorded', 'playing', 'paused', 'uploading'].includes(phase);

  const totalSeconds = isRecording
    ? MAX_DURATION_S
    : (isPlaying || phase === 'paused') && playDuration > 0
      ? playDuration
      : MAX_DURATION_S;

  const currentPos = isRecording ? recDurationS
    : (isPlaying || phase === 'paused') ? playPos
    : 0;

  const progress = totalSeconds > 0 ? Math.min(currentPos / totalSeconds, 1) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={26} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Voice intro</Text>
        {hasRecording ? (
          <TouchableOpacity onPress={() => setShowOptions(true)} style={s.moreBtn} activeOpacity={0.7}>
            <MoreVertical size={22} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={s.moreBtn} />
        )}
      </View>

      {/* ── Body ── */}
      <View style={s.body}>
        {/* Idle state */}
        {phase === 'idle' && (
          <View style={s.idleContent}>
            <Text style={[s.bigTitle, { color: colors.textPrimary }]}>
              Make an impression{'\n'}with a voice intro
            </Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Introduce yourself! Talk about what excites you, tell a funny story, or just say hi to make your matches smile…
            </Text>
          </View>
        )}

        {/* Player card — shown when recorded/playing/paused */}
        {hasRecording && (
          <View style={[s.playerCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={s.playBtn}
              onPress={() => {
                if (isPlaying)               pausePlayback();
                else if (phase === 'paused') resumePlayback();
                else                         startPlayback();
              }}
              activeOpacity={0.85}
              disabled={isUploading}
            >
              {isPlaying
                ? <Pause size={24} color="#fff" strokeWidth={2.5} />
                : <Play  size={24} color="#fff" strokeWidth={2.5} style={{ marginLeft: 3 }} />
              }
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Waveform isActive={isPlaying} progress={progress} />
            </View>
          </View>
        )}

        {/* Recording badge */}
        {isRecording && (
          <View style={s.recordingBadge}>
            <View style={s.redDot} />
            <Text style={s.recordingText}>
              Recording  {fmt(recDurationS)} / {fmt(MAX_DURATION_S)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Footer ── */}
      <View style={s.footer}>
        {/* Idle */}
        {phase === 'idle' && (
          <>
            <Text style={[s.tapHint, { color: colors.textSecondary }]}>
              Tap to start recording
            </Text>
            <TouchableOpacity style={s.micBtn} onPress={startRecording} activeOpacity={0.85}>
              <Mic size={32} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </>
        )}

        {/* Recording */}
        {isRecording && (
          <TouchableOpacity
            style={[s.micBtn, s.stopBtn]}
            onPress={stopRecording}
            activeOpacity={0.85}
          >
            <View style={s.stopSquare} />
          </TouchableOpacity>
        )}

        {/* Recorded — Save + Re-record */}
        {hasRecording && !isUploading && (
          <View style={s.recordedActions}>
            {!hasExisting && (
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.86}
              >
                <Text style={s.saveBtnText}>Save voice intro</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.rerecordBtn, { borderColor: colors.border }]}
              onPress={handleReplace}
              activeOpacity={0.86}
            >
              <RefreshCw size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.rerecordText, { color: colors.textSecondary }]}>Re-record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Uploading */}
        {isUploading && (
          <View style={s.uploadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[s.tapHint, { color: colors.textSecondary }]}>Saving…</Text>
          </View>
        )}
      </View>

      {/* ── Options Modal ── */}
      <OptionsModal
        visible={showOptions}
        onReplace={handleReplace}
        onDelete={handleDelete}
        onCancel={() => setShowOptions(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 8,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  backBtn:     { padding: 8 },
  moreBtn:     { padding: 8, width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'OutfitBold' },

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 36 },

  idleContent: { gap: 16, alignItems: 'center' },
  bigTitle: {
    fontSize:   26,
    fontFamily: 'OutfitBold',
    lineHeight: 34,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:   15,
    fontFamily: 'Outfit',
    lineHeight: 22,
    textAlign:  'center',
  },

  playerCard: {
    flexDirection: 'row',
    alignItems:    'center',
    borderRadius:  18,
    padding:       16,
    gap:           14,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     3,
  },
  playBtn: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: '#111',
    alignItems:      'center',
    justifyContent:  'center',
  },

  recordingBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    marginTop:      24,
  },
  redDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  recordingText: { fontSize: 14, fontFamily: 'OutfitMedium', color: '#EF4444' },

  footer: {
    paddingHorizontal: 24,
    paddingBottom:     40,
    alignItems:        'center',
    gap:               16,
  },

  tapHint: { fontSize: 15, fontFamily: 'OutfitMedium' },

  micBtn: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.35,
    shadowRadius:    12,
    elevation:       8,
  },
  stopBtn:    { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  stopSquare: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#121212' },

  recordedActions: { width: '100%', gap: 12 },

  saveBtn: {
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    50,
    paddingVertical: 15,
    width:           '100%',
  },
  saveBtnText: { color: '#fff', fontFamily: 'OutfitBold', fontSize: 16 },

  rerecordBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    borderRadius:    50,
    borderWidth:     1.5,
    paddingVertical: 13,
    width:           '100%',
  },
  rerecordText: { fontSize: 15, fontFamily: 'OutfitMedium' },

  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});