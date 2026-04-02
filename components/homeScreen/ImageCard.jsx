import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import LoadingImage from '../ui/LoadingImage';

const ImageCard = ({ imageSource, fullName, age, occupation }) => {
  return (
    <View style={styles.card}>
      <LoadingImage source={imageSource} style={styles.image} containerStyle={{ width: '100%', height: '100%' }} contentFit="cover" indicatorColor="#fff" />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.overlay}
      >
        <Text style={styles.name}>
          {fullName}, {age}
        </Text>
        <Text style={styles.occupation}>{occupation}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 500,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  occupation: {
    color: "#ccc",
    fontSize: 16,
  },
});

export default ImageCard;
