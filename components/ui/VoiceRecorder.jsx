import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Audio } from "expo-av";
import { Mic, ChevronLeft, ArrowUp } from "lucide-react-native";
import Waveform from "./Waveform";

export default function VoiceRecorder({ onSendAudio, onCancel }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationRef = useRef(0);
  const recordingRef = useRef(null); // Use ref instead of module variable

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
    
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      durationRef.current = 0;
      setRecordingDuration(0);
      interval = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    if (!hasPermission) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      
      // Check if already recording
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // Create new recording instance
      const { Recording } = Audio;
      recordingRef.current = new Recording();
      await recordingRef.current.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recordingRef.current.startAsync();

      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      recordingRef.current = null;
      setIsRecording(false);
    }
  };

  const stopRecording = async (send = true) => {
    try {
      if (!recordingRef.current) return;
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      setIsRecording(false);
      
      if (send && uri && onSendAudio) {
        onSendAudio(uri);
      }
      if (!send && onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      {isRecording ? (
        <>
          <TouchableOpacity
            onPress={() => stopRecording(false)}
            style={styles.cancelBtn}
          >
            <ChevronLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.waveformContainer}>
            <Text style={styles.durationText}>
              {formatTime(recordingDuration)}
            </Text>
            <Waveform isRecording={isRecording} />
          </View>
          
          <TouchableOpacity
            onPress={() => stopRecording(true)}
            style={styles.sendButton}
          >
            <ArrowUp size={24} color="white" />
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          onPress={startRecording}
          style={styles.micButton}
        >
          <Mic size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  durationText: {
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  cancelBtn: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
});