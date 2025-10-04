import React, { createContext, useContext, useState, useEffect } from "react";
import { profiles } from "../data/profileData";

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  // Global stats
  const [matches, setMatches] = useState(12);
  const [likes, setLikes] = useState(48);
  const [profilesData, setProfilesData] = useState([]);

  // Separate states for home and discover screens
  const [homeSwipedProfiles, setHomeSwipedProfiles] = useState([]);
  const [discoverSwipedProfiles, setDiscoverSwipedProfiles] = useState([]);
  const [homeCurrentIndex, setHomeCurrentIndex] = useState(0);
  const [discoverCurrentIndex, setDiscoverCurrentIndex] = useState(0);

  useEffect(() => {
    setProfilesData(profiles);
  }, []);

  // Home screen actions
  const addHomeSwipedProfile = (profileId) => {
    setHomeSwipedProfiles((prev) => [...prev, profileId]);
  };

  const handleHomeSwipe = (direction, profile) => {
    if (direction === "right") {
      setMatches((prev) => prev + 1);
      setLikes((prev) => prev + 1);
    }

    addHomeSwipedProfile(profile.id);
    setHomeCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleHomeSuperLike = (profile) => {
    setMatches((prev) => prev + 1);
    setLikes((prev) => prev + 1);
    addHomeSwipedProfile(profile.id);
    setHomeCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  // Discover screen actions
  const addDiscoverSwipedProfile = (profileId) => {
    setDiscoverSwipedProfiles((prev) => [...prev, profileId]);
  };

  const handleDiscoverSwipe = (direction, profile) => {
    if (direction === "right") {
      setMatches((prev) => prev + 1);
      setLikes((prev) => prev + 1);
    }

    addDiscoverSwipedProfile(profile.id);
    setDiscoverCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleDiscoverSuperLike = (profile) => {
    setMatches((prev) => prev + 1);
    setLikes((prev) => prev + 1);
    addDiscoverSwipedProfile(profile.id);
    setDiscoverCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  // Filter profiles for each screen
  const homeProfiles = profilesData.filter(
    (profile) => !homeSwipedProfiles.includes(profile.id)
  );

  const discoverProfiles = profilesData.filter(
    (profile) => !discoverSwipedProfiles.includes(profile.id)
  );

  const value = {
    // Home screen
    homeCurrentProfileIndex: homeCurrentIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,

    // Discover screen
    discoverCurrentProfileIndex: discoverCurrentIndex,
    discoverProfiles,
    handleDiscoverSwipe,
    handleDiscoverSuperLike,

    // Global stats
    matches,
    likes,

    // Utility functions
    setHomeCurrentIndex,
    setDiscoverCurrentIndex,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
