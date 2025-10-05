import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constant/colors";
import StatusModal from "../../components/modals/StatusModal"; 

const initialStatuses = [
  {
    id: "1",
    name: "Your Status",
    image: "https://i.pravatar.cc/150?img=1",
    isUser: true,
  },
  {
    id: "2",
    name: "Jane",
    image: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "3",
    name: "Alex",
    image: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "4",
    name: "Sam",
    image: "https://i.pravatar.cc/150?img=4",
  },
];

const Status = () => {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleUploadPhotoStatus = () => {
    setIsModalVisible(false);
    Alert.alert("Upload Status", "Open image picker or camera here.");
  };

  const handleCreateTextStatus = () => {
    setIsModalVisible(false);
    Alert.alert("Text Status", "Open text input editor here.");
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        onPress={() =>
          item.isUser
            ? setIsModalVisible(true)
            : Alert.alert("Viewing Status", `Viewing ${item.name}'s status`)
        }
      >
        {item.isUser ? (
          <View style={styles.userCircle}>
            <Image source={{ uri: item.image }} style={styles.userImage} />
            <View style={styles.addIcon}>
              <Plus size={18} color="#fff" />
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={[colors.primary, "#A80EC1", "#F72585"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.innerCircle}>
              <Image source={{ uri: item.image }} style={styles.image} />
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statuses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* ✅ Reusable modal */}
      <StatusModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onUploadPhoto={handleUploadPhotoStatus}
        onCreateText={handleCreateTextStatus}
      />
    </View>
  );
};

export default Status;

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
    marginBottom: 10,
  },
  itemContainer: {
    marginRight: 18,
    alignItems: "center",
    width: 85,
  },
  gradientBorder: {
    borderRadius: 50,
    padding: 4,
  },
  innerCircle: {
    backgroundColor: "#111",
    borderRadius: 50,
    padding: 2,
  },
  userCircle: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 50,
    padding: 3,
    position: "relative",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  name: {
    marginTop: 5,
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  addIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: "#000",
  },
});
