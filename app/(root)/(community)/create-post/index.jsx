import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Image as ImageIcon, Hash } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../../../../components/community/styles/communityStyles";

const CreatePostScreen = () => {
  const { communityId, topicId } = useLocalSearchParams();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please write something before posting");
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would make an API call to create the post
      console.log("Creating post:", {
        communityId,
        topicId,
        content,
        image,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Your post has been published!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.createPostHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.createPostTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.postButton, isSubmitting && styles.disabledButton]}
        >
          <Text style={styles.postButtonText}>
            {isSubmitting ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.createPostContainer}>
        <TextInput
          placeholder="What's on your mind?"
          style={styles.postContentInput}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <ImageIcon size={20} color="#666" />
            <Text style={styles.actionButtonText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Hash size={20} color="#666" />
            <Text style={styles.actionButtonText}>Topic</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
