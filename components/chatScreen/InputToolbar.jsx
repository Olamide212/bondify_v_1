// components/InputToolbar.js
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus, Mic, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";

const InputToolbar = ({ sendMessage, onSendImage, onSendVoice }) => {
  const [messageText, setMessageText] = useState("");
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const handleImagePicker = async () => {
    if (!onSendImage || isUploadingMedia) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    const fileName =
      asset.fileName ||
      `image-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
    const mimeType = asset.mimeType || "image/jpeg";

    setIsUploadingMedia(true);
    try {
      await onSendImage({
        uri: asset.uri,
        fileName,
        mimeType,
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isUploadingMedia || !onSendVoice) return;

    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(newRecording);
    setIsRecording(true);
    setRecordingStartedAt(Date.now());
  };

  const stopRecording = async () => {
    if (!recording || !onSendVoice) return;

    setIsUploadingMedia(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      const durationMs = recordingStartedAt
        ? Math.max(Date.now() - recordingStartedAt, 0)
        : 0;

      if (uri) {
        const fileExtension = uri.split('.').pop() || 'm4a';
        await onSendVoice({
          uri,
          fileName: `voice-${Date.now()}.${fileExtension}`,
          mimeType: "audio/m4a",
          durationMs,
        });
      }
    } finally {
      setRecording(null);
      setIsRecording(false);
      setRecordingStartedAt(null);
      setIsUploadingMedia(false);
    }
  };

  const handleVoicePress = async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText("");
    }
  };

  const isSendEnabled = messageText.trim().length > 0 && !isUploadingMedia;

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleImagePicker}
          disabled={isUploadingMedia || isRecording}
        >
          <ImagePlus color={colors.primary} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleVoicePress}
          disabled={isUploadingMedia}
        >
          <Mic color={isRecording ? "#EF4444" : colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={messageText}
        onChangeText={setMessageText}
        multiline
      />

      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleSend}
        disabled={!isSendEnabled}
        className='bg-primary rounded-full p-2'
      >
        <Send color={"#fff"} size={20} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  iconButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
});

export default InputToolbar;
