import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { styles } from "./styles/communityStyles";
import { useRouter } from "expo-router";

const CreatePostButton = ({ onPress }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.createPostButton}
      onPress={() => router.push("/create-post")}
    >
      <Text style={styles.createPostText}>Create New Post</Text>
    </TouchableOpacity>
  );
};

export default CreatePostButton;
