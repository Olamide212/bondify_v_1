import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  Heart,
  MapPin,
  User,
  Star,
  Briefcase,
    BadgeCheck,
  Pencil,
} from "lucide-react-native";
import { useRouter } from "expo-router";

const ProfileSection = ({ profile }) => {
  const completion = profile.completion || 80; // fallback to 80% for demo
  
  const router = useRouter()

  // Circle setup
  const size = 150; // overall size
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (completion / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }} className="relative">
        {/* Background Circle */}
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            stroke="#fff"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            stroke="#6C47FF" // primary color
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </Svg>

        {/* Profile Image in center */}
        <View style={styles.imageWrapper} className="relative">
          <Image
            source={{ uri: profile?.images?.[1] }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        {profile.completion && (
          <View className="w-16 absolute bg-[#6C47FF] px-2 py-1 rounded-full top-0 z-50  right-6 flex-row justify-center items-center ">
            <Text className="text-white font-SatoshiMedium font-sm">
              {completion}%
            </Text>
          </View>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.infoWrapper}>
        <View className="flex-row items-center">
          <Text style={styles.name}>
            {profile.name}, {profile.age} {profile.verified}
          </Text>
          {profile.verified && (
            <View>
              <BadgeCheck size={18} color="#EFBF04" fill="#fff" />
            </View>
          )}
        </View>

        <Pressable
          className="flex-row justify-center items-center gap-2  py-2 rounded-full mt-3 bg-[#6C47FF] "
          onPress={() => router.push("/profile-details")}
        >
          <Pencil color="white" size={16} />
          <Text className="text-white font-SatoshiMedium">Edit Profile</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "col",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  imageWrapper: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 100,
  },
  infoWrapper: {
    marginTop: 10,
  },
  name: {
    fontSize: 22,
    fontFamily: "SatoshiBold",
    color: "#fff",
    textAlign: "center",
  },
  percentage: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginTop: 5,
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: "#3B82F6",
    padding: 4,
    borderRadius: 50,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default ProfileSection;
