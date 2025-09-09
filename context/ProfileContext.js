import React, { createContext, useContext, useState, useEffect } from "react";
import { profiles } from "../data/profileData"; // Import the profiles data

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [matches, setMatches] = useState(12);
  const [likes, setLikes] = useState(48);
  const [profilesData, setProfilesData] = useState([]);

  useEffect(() => {
    // Set the profiles data on component mount
    setProfilesData(profiles);
  }, []);

  const handleSwipe = (direction) => {
    if (direction === "right") {
      setMatches((prev) => prev + 1);
      setLikes((prev) => prev + 1);
    }

    // Move to next profile
    setCurrentProfileIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleSuperLike = () => {
    setMatches((prev) => prev + 1);
    setLikes((prev) => prev + 1);
    setCurrentProfileIndex((prev) => (prev + 1) % profilesData.length);
  };

  const value = {
    currentProfileIndex,
    matches,
    likes,
    handleSwipe,
    handleSuperLike,
    setCurrentProfileIndex,
    profiles: profilesData, // Use the state variable
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
