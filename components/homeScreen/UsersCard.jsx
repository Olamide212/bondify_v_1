import React, { useState } from "react";
import { View } from "react-native";
import MatchStats from "./MatchStats";
import ProfileCard from "./ProfileCard";
import ActionButtons from "./ActionButtons";
import { images } from "../../constant/images";

const profiles = [
  {
    id: 1,
    name: "Emma",
    age: 26,
    location: "New York, NY",
    distance: "2 miles away",
    bio: "Adventure seeker, coffee enthusiast, and dog lover.",
    images: [images.userImage],
    interests: ["Travel", "Photography", "Hiking", "Coffee"],
    verified: true,
  },
  {
    id: 2,
    name: "Sarah",
    age: 24,
    location: "Brooklyn, NY",
    distance: "5 miles away",
    bio: "Artist by day, foodie by night.",
    images: [images.userImage],
    interests: ["Art", "Food", "Music", "Dancing"],
    verified: false,
  },
];

export default function UsersCard() {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState(12);
  const [likes, setLikes] = useState(48);

  const currentProfile = profiles[currentProfileIndex];

  const handleSwipe = (direction) => {
    if (direction === "right") setMatches((prev) => prev + 1);
    setTimeout(() => {
      setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
    }, 300);
  };

  const handleSuperLike = () => {
    setMatches((prev) => prev + 1);
    setTimeout(() => {
      setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
    }, 300);
  };

  return (
    <View style={{flex: 1}} className="bg-app">
  {/*    <MatchStats matches={matches} likes={likes} />*/}
      <ProfileCard profile={currentProfile} />
      <ActionButtons onSwipe={handleSwipe} onSuperLike={handleSuperLike} />
    </View>
  );
}
