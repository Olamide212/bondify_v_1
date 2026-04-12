// components/profileScreen/voicePrompts/VoiceIntroCard.js

import {
  createAudioPlayer,
  setAudioModeAsync
} from 'expo-audio';
import {
  ArrowUpCircle,
  Mic,
  MoreVertical,
  Pause,
  Play,
  Trash2
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlert } from '../../../context/AlertContext';
import { useTheme } from '../../../context/ThemeContext';
import { voiceIntroStore } from '../../../store/voiceIntroStore';
import BaseModal from '../../modals/BaseModal';

const BAR_COUNT = 40;

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

// ─── Waveform (static — profile card doesn't animate on its own) ──────────────

const Waveform = ({ progress = 0, isPlaying }) => {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => ({
      anim:   new Animated.Value(0.15 + Math.random() * 0.4),
      height: 6 + Math.random() * 38,
    }))
  ).current;

  useEffect(() => {
    let anims;
    if (isPlaying) {
      anims = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar.anim, {
              toValue:         0.3 + Math.random() * 0.7,
              duration:        120 + i * 15,
              useNativeDriver: true,
            }),
            Animated.timing(bar.anim, {
              toValue:         0.1,
              duration:        120 + i * 15,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach((a) => a.start());
    } else {
      bars.forEach((bar) =>
        Animated.spring(bar.anim, {
          toValue:    1,
          useNativeDriver: true,
          bounciness: 2,
        }).start()
      );
    }
    return () => anims?.forEach((a) => a.stop());
  }, [isPlaying]);

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
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
    height:         52,
    justifyContent: 'center',
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
  group:      { backgroundColor: '#1E1E1E', borderRadius: 16, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 16 },
  iconWrap:   { width: 28, alignItems: 'center' },
  rowText:    { fontSize: 17, fontFamily: 'PlusJakartaSansSemiBold', color: '#E5E5E5' },
  divider:    { height: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  cancelBtn:  { backgroundColor: '#1E1E1E', borderRadius: 16, alignItems: 'center', paddingVertical: 18 },
  cancelText: { fontSize: 17, fontFamily: 'PlusJakartaSansSemiBold', color: '#E5E5E5' },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoiceIntroCard({ hasRecording, voiceUri, onPress, onDelete, onReplace }) {
  const { colors }    = useTheme();
  const { showAlert } = useAlert();

  const [phase,        setPhase]        = useState('idle'); // idle | playing | paused
  const [playPos,      setPlayPos]      = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [showOptions,  setShowOptions]  = useState(false);

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

  // Stop player if recording is removed
  useEffect(() => {
    if (!hasRecording && playerRef.current) {
      playerRef.current.removeAllListeners('playbackStatusUpdate');
      playerRef.current.remove();
      playerRef.current = null;
      setPhase('idle');
      setPlayPos(0);
    }
  }, [hasRecording]);

  const startPlayback = async () => {
    if (!voiceUri) return;
    try {
      await ensureAudioMode();

      if (playerRef.current) {
        playerRef.current.removeAllListeners('playbackStatusUpdate');
        playerRef.current.remove();
        playerRef.current = null;
      }

      const player = createAudioPlayer({ uri: voiceUri });
      playerRef.current = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.error) {
          console.error('[VoiceIntroCard] playback error:', status.error);
          setPhase('idle');
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
          setPhase('idle');
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
      console.error('[VoiceIntroCard] startPlayback:', err);
      setPhase('idle');
    }
  };

  const pausePlayback  = () => { playerRef.current?.pause(); setPhase('paused'); };
  const resumePlayback = () => { playerRef.current?.play();  setPhase('playing'); };

  const handleDeleteConfirm = () => {
    setShowOptions(false);
    showAlert({
      icon:    'delete',
      title:   'Delete voice intro',
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
            setPhase('idle');
            setPlayPos(0);
            try {
              await voiceIntroStore.delete();
              onDelete?.(); // notify parent to clear profile.voicePrompt
            } catch (err) {
              console.error('[VoiceIntroCard] delete error:', err);
            }
          },
        },
      ],
    });
  };

  const isPlaying = phase === 'playing';
  const progress  = playDuration > 0 ? Math.min(playPos / playDuration, 1) : 0;

  // ── Empty state (no recording) ────────────────────────────────────────────
  if (!hasRecording) {
    return (
      <TouchableOpacity
        style={[s.emptyCard, { borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[s.emptyLabel, { color: colors.textPrimary }]}>Record an intro</Text>
        <Mic size={24} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>
    );
  }

  // ── Recorded state — player card ──────────────────────────────────────────
  return (
    <>
      <View style={[s.playerCard, { backgroundColor: colors.surface }]}>
        {/* Play / Pause */}
        <TouchableOpacity
          style={s.playBtn}
          onPress={() => {
            if (isPlaying)             pausePlayback();
            else if (phase === 'paused') resumePlayback();
            else                       startPlayback();
          }}
          activeOpacity={0.85}
        >
          {isPlaying
            ? <Pause size={22} color="#fff" strokeWidth={2.5} />
            : <Play  size={22} color="#fff" strokeWidth={2.5} style={{ marginLeft: 2 }} />
          }
        </TouchableOpacity>

        {/* Waveform */}
        <View style={{ flex: 1 }}>
          <Waveform isPlaying={isPlaying} progress={progress} />
        </View>

        {/* Three-dot menu */}
        <TouchableOpacity
          style={s.moreBtn}
          onPress={() => setShowOptions(true)}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <OptionsModal
        visible={showOptions}
        onReplace={() => {
          setShowOptions(false);
          onReplace?.(); // parent navigates to voice-intro screen
        }}
        onDelete={handleDeleteConfirm}
        onCancel={() => setShowOptions(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  // Empty / no-recording card
  emptyCard: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   18,
    borderRadius:      14,
    borderWidth:       1.5,
    borderStyle:       'dashed',
    marginHorizontal:  16,
    backgroundColor: '#121212',
  },
  emptyLabel: { fontSize: 16, fontFamily: 'PlusJakartaSansSemiBold' },

  // Player card
  playerCard: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   18,
    padding:        14,
    gap:            12,
    marginHorizontal: 16,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.06,
    shadowRadius:   8,
    elevation:      3,
  },
  playBtn: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: '#111',
    alignItems:      'center',
    justifyContent:  'center',
  },
  moreBtn: {
    padding: 6,
  },
});