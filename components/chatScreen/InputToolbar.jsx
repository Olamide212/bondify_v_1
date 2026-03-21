// // components/InputToolbar.js
// import { Audio } from "expo-av";
// import * as ImagePicker from "expo-image-picker";
// import { Edit2, Mic, Reply, Send, X } from "lucide-react-native";
// import { useEffect, useRef, useState } from "react";
// import {
//   Image,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { colors } from "../../constant/colors";
// import { Icons } from "../../constant/icons";
// import { socketService } from "../../services/socketService";
// import RizzModal from "./RizzModal";

// const VOICE_ICON_COLOR = "#64748B";

// const InputToolbar = ({ sendMessage, onSendImage, onSendVoice, matchId, currentUserId, replyTo, onCancelReply, editMessage, onCancelEdit }) => {
//   const [messageText, setMessageText] = useState("");
//   const [showRizzModal, setShowRizzModal] = useState(false);
//   const typingTimeoutRef = useRef(null);
//   const [recording, setRecording] = useState(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingStartedAt, setRecordingStartedAt] = useState(null);
//   const [isUploadingMedia, setIsUploadingMedia] = useState(false);

//   useEffect(() => {
//     return () => {
//       if (recording) {
//         recording.stopAndUnloadAsync().catch(() => {});
//       }
//     };
//   }, [recording]);

//   const handleImagePicker = async () => {
//     if (!onSendImage || isUploadingMedia) return;

//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (permission.status !== "granted") return;

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: false,
//       quality: 0.8,
//     });

//     if (result.canceled || !result.assets?.[0]?.uri) return;

//     const asset = result.assets[0];
//     const fileName =
//       asset.fileName ||
//       `image-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
//     const mimeType = asset.mimeType || "image/jpeg";

//     setIsUploadingMedia(true);
//     try {
//       await onSendImage({ uri: asset.uri, fileName, mimeType });
//     } finally {
//       setIsUploadingMedia(false);
//     }
//   };

//   const startRecording = async () => {
//     if (isRecording || isUploadingMedia || !onSendVoice) return;

//     const permission = await Audio.requestPermissionsAsync();
//     if (!permission.granted) return;

//     await Audio.setAudioModeAsync({
//       allowsRecordingIOS: true,
//       playsInSilentModeIOS: true,
//     });

//     const { recording: newRecording } = await Audio.Recording.createAsync(
//       Audio.RecordingOptionsPresets.HIGH_QUALITY
//     );

//     setRecording(newRecording);
//     setIsRecording(true);
//     setRecordingStartedAt(Date.now());
//   };

//   const stopRecording = async () => {
//     if (!recording || !onSendVoice) return;

//     setIsUploadingMedia(true);
//     try {
//       await recording.stopAndUnloadAsync();
//       const uri = recording.getURI();
//       const durationMs = recordingStartedAt
//         ? Math.max(Date.now() - recordingStartedAt, 0)
//         : 0;

//       if (uri) {
//         const fileExtension = uri.split(".").pop() || "m4a";
//         await onSendVoice({
//           uri,
//           fileName: `voice-${Date.now()}.${fileExtension}`,
//           mimeType: "audio/m4a",
//           durationMs,
//         });
//       }
//     } finally {
//       setRecording(null);
//       setIsRecording(false);
//       setRecordingStartedAt(null);
//       setIsUploadingMedia(false);
//     }
//   };

//   const handleVoicePress = async () => {
//     if (isRecording) {
//       await stopRecording();
//       return;
//     }
//     await startRecording();
//   };

//   // Prefill input for edit
//   useEffect(() => {
//     if (editMessage) {
//       setMessageText(editMessage.text);
//     }
//   }, [editMessage]);

//   const handleSend = () => {
//     if (!messageText.trim()) return;
//     if (editMessage) {
//       sendMessage(messageText, { edit: true, editMessage });
//       setMessageText("");
//       onCancelEdit?.();
//       return;
//     }
//     sendMessage(messageText, replyTo ? { replyTo } : undefined);
//     setMessageText("");
//     if (replyTo) onCancelReply?.();
//   };

//   const isSendEnabled = messageText.trim().length > 0 && !isUploadingMedia;

//   const handleTyping = (text) => {
//     setMessageText(text);
//     if (!matchId || !currentUserId) return;
//     socketService.emit("typing", { matchId, userId: currentUserId });
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = setTimeout(() => {
//       socketService.emit("stop_typing", { matchId, userId: currentUserId });
//     }, 2000);
//   };

//   return (




//     <>
//       {(replyTo || editMessage) && (
//         <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 8, marginHorizontal: 16, marginBottom: 2 }}>
//           {replyTo && <Reply size={18} color={colors.primary} style={{ marginRight: 6 }} />}
//           {editMessage && <Edit2 size={18} color={colors.primary} style={{ marginRight: 6 }} />}
//           <View style={{ flex: 1 }}>
//             <Text style={{ color: '#111', fontWeight: '600' }} numberOfLines={1}>
//               {replyTo ? `Replying to: ${replyTo.text?.slice(0, 40)}` : `Editing: ${editMessage?.text?.slice(0, 40)}`}
//             </Text>
//           </View>
//           <TouchableOpacity onPress={replyTo ? onCancelReply : onCancelEdit} hitSlop={8}>
//             <X size={18} color="#6B7280" />
//           </TouchableOpacity>
//         </View>
//       )}
//       <View style={styles.container}>
//         {/* ── Left: AI Rizz button ── */}
//         <View style={styles.leftActions}>
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={() => setShowRizzModal(true)}
//           >
//             {/* <Sparkle color={colors.primary} size={30} /> */}
//             <Image source={Icons.AiIcon} style={{width: 30, height: 30}} />
//           </TouchableOpacity>
//           {/* ✅ matchId is now passed so AI fetches personalised icebreakers */}
//           <RizzModal
//             visible={showRizzModal}
//             matchId={matchId}
//             onClose={() => setShowRizzModal(false)}
//             onSend={(rizz) => {
//               sendMessage(rizz);
//               setShowRizzModal(false);
//             }}
//           />
//         </View>
//         {/* ── Centre: text input + mic ── */}
//         <View
//           className="border border-gray-200 flex-1 flex-row items-center rounded-full mr-3"
//           style={{ paddingHorizontal: 5 }}
//         >
//           <TextInput
//             style={styles.input}
//             placeholder="Type a message..."
//             value={messageText}
//             onChangeText={handleTyping}
//             multiline
//             className="placeholder:text-gray-400 flex-1"
//           />
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={handleVoicePress}
//             disabled={isUploadingMedia}
//           >
//             <Mic color={isRecording ? colors.activePrimary : VOICE_ICON_COLOR} size={20} />
//           </TouchableOpacity>
//         </View>
//         {/* ── Right: send button ── */}
//         <View style={styles.rightActions}>
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={handleSend}
//             disabled={!isSendEnabled}
//             className="bg-primary rounded-full p-2"
//           >
//             <Send color={"#fff"} size={20} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingTop: 16,
//     paddingBottom: 10,
//     paddingHorizontal: 16,
//     backgroundColor: "#fff",
//     borderTopWidth: 1,
//     borderTopColor: "#F1F5F9",
//   },
//   leftActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginRight: 8,
//   },
//   rightActions: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginLeft: 4,
//   },
//   iconButton: {
//     padding: 10,
//   },
//   input: {
//     flex: 1,
//     borderRadius: 15,
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     maxHeight: 100,
//     fontSize: 16,
//     marginRight: 8,
//   },
// });

// export default InputToolbar;


// components/InputToolbar.js
import { AntDesign } from '@expo/vector-icons';
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Edit2, Mic, Reply, Send, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constant/colors";
import { socketService } from "../../services/socketService";
import RizzModal from "./RizzModal";

const VOICE_ICON_COLOR = "#64748B";

const InputToolbar = ({ sendMessage, onSendImage, onSendVoice, matchId, currentUserId, replyTo, onCancelReply, editMessage, onCancelEdit }) => {
  const [messageText, setMessageText] = useState("");
  const [showRizzModal, setShowRizzModal] = useState(false);
  const typingTimeoutRef = useRef(null);
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

  // Pre-fill input when entering edit mode; clear when cancelled
  useEffect(() => {
    if (editMessage) {
      setMessageText(editMessage.text ?? "");
    } else {
      setMessageText("");
    }
  }, [editMessage]);

  const handleImagePicker = async () => {
    if (!onSendImage || isUploadingMedia) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    const fileName =
      asset.fileName ||
      `image-${Date.now()}.${asset.uri.split(".").pop() || "jpg"}`;
    const mimeType = asset.mimeType || "image/jpeg";

    setIsUploadingMedia(true);
    try {
      await onSendImage({ uri: asset.uri, fileName, mimeType });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isUploadingMedia || !onSendVoice) return;

    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;

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
        const fileExtension = uri.split(".").pop() || "m4a";
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
    const trimmed = messageText.trim();
    if (!trimmed) return;

    if (editMessage) {
      // Signal to parent that this is an edit
      sendMessage(trimmed, { edit: true });
      setMessageText("");
      onCancelEdit?.();
      return;
    }

    sendMessage(trimmed);
    setMessageText("");
    if (replyTo) onCancelReply?.();
  };

  const isSendEnabled = messageText.trim().length > 0 && !isUploadingMedia;

  const handleTyping = (text) => {
    setMessageText(text);
    if (!matchId || !currentUserId) return;
    socketService.emit("typing", { matchId, userId: currentUserId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit("stop_typing", { matchId, userId: currentUserId });
    }, 2000);
  };

  return (
    <>
      {/* ── Reply / Edit context banner ── */}
      {(replyTo || editMessage) && (
        <View style={styles.contextBanner}>
          {replyTo
            ? <Reply size={16} color={colors.primary} style={{ marginRight: 6 }} />
            : <Edit2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
          }
          <View style={{ flex: 1 }}>
            <Text style={styles.contextLabel}>
              {replyTo ? "Replying to" : "Editing message"}
            </Text>
            <Text style={styles.contextPreview} numberOfLines={1}>
              {(replyTo?.text || editMessage?.text || "").slice(0, 60)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={replyTo ? onCancelReply : onCancelEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.container}>

      {/* ── Left: AI Rizz button ── */}
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowRizzModal(true)}
        >
          <AntDesign name="robot" size={28} color={colors.gray} />
        </TouchableOpacity>

        {/* ✅ matchId is now passed so AI fetches personalised icebreakers */}
        <RizzModal
          visible={showRizzModal}
          matchId={matchId}
          onClose={() => setShowRizzModal(false)}
          onSend={(rizz) => {
            sendMessage(rizz);
            setShowRizzModal(false);
          }}
        />
      </View>

      {/* ── Centre: text input + mic ── */}
      <View
        className="border border-gray-200 flex-1 flex-row items-center rounded-full mr-3"
        style={{ paddingHorizontal: 5 }}
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={handleTyping}
          multiline
          className="placeholder:text-gray-400 flex-1"
        />
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleVoicePress}
          disabled={isUploadingMedia}
        >
          <Mic color={isRecording ? colors.activePrimary : VOICE_ICON_COLOR} size={20} />
        </TouchableOpacity>
      </View>

      {/* ── Right: send button ── */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleSend}
          disabled={!isSendEnabled}
          className="bg-primary rounded-full p-2"
        >
          <Send color={"#fff"} size={20} />
        </TouchableOpacity>
      </View>

    </View>
  );
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 30,
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
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  iconButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  // Reply / Edit context banner
  contextBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 6,
  },
  contextLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSansBold",
    color: colors.primary,
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  contextPreview: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans",
    color: "#374151",
  },
});

export default InputToolbar;