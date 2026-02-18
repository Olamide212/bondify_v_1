import React, { createContext, useContext, useState, useEffect } from "react";
import { profiles } from "../data/profileData";
import { profileService } from "../services/profileService";

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

  const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image) => (typeof image === "string" ? image : image?.url))
      .filter(Boolean);
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== "object") return location || "";
    const parts = [location.city, location.state, location.country].filter(
      Boolean
    );
    return parts.join(", ");
  };

  const normalizeProfile = (profile) => {
    const normalizedImages = normalizeImages(profile?.images);
    return {
      id: profile?._id ?? profile?.id,
      name: profile?.name ?? profile?.username ?? "Unknown",
      age: profile?.age ?? null,
      gender: profile?.gender,
      zodiac: profile?.zodiacSign ?? profile?.zodiac,
      location: formatLocation(profile?.location) || profile?.location,
      distance: profile?.distance,
      bondScore: profile?.bondScore,
      verified: profile?.verified ?? profile?.isVerified ?? false,
      occupation: profile?.occupation,
      completion: profile?.completionPercentage ?? profile?.completion,
      religion: profile?.religion,
      education: profile?.education,
      school: profile?.school,
      height: profile?.height,
      loveStyle: profile?.loveLanguage ?? profile?.loveStyle,
      communicationStyle: profile?.communicationStyle,
      financialStyle: profile?.financialStyle,
      lookingFor: profile?.lookingFor,
      relationshipType: profile?.relationshipType,
      drinking: profile?.drinking,
      smoking: profile?.smoking,
      exercise: profile?.exercise,
      pets: profile?.pets,
      children: profile?.children,
      lastActive: profile?.lastActive,
      joined: profile?.joined,
      language: profile?.languages ?? profile?.language ?? [],
      nationality: profile?.nationality,
      ethnicity: profile?.ethnicity,
      mutualFriends: profile?.mutualFriends ?? 0,
      mutualInterests: profile?.mutualInterests ?? [],
      interests: profile?.interests ?? [],
      personalities: profile?.personalities ?? [],
      bio: profile?.bio ?? "",
      questions: profile?.questions ?? [],
      images: normalizedImages.length > 0 ? normalizedImages : [],
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      try {
        const discoveryProfiles = await profileService.getDiscoveryProfiles();
        const normalizedProfiles = discoveryProfiles.map(normalizeProfile);
        if (isMounted) {
          setProfilesData(
            normalizedProfiles.length > 0 ? normalizedProfiles : profiles
          );
        }
      } catch (error) {
        if (isMounted) {
          setProfilesData(profiles);
        }
      }
    };

    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Home screen actions
  const addHomeSwipedProfile = (profileId) => {
    if (!profileId) return;
    setHomeSwipedProfiles((prev) => [...prev, profileId]);
  };

  const recordSwipeAction = async (profileId, type) => {
    if (!profileId) return null;
    try {
      return await profileService.performSwipeAction({
        likedUserId: profileId,
        type,
      });
    } catch (error) {
      console.error("Swipe action failed:", error);
      return null;
    }
  };

  const updateStatsForSwipe = (type, actionResponse) => {
    if (!actionResponse) return;
    if (type === "like" || type === "superlike") {
      setLikes((prev) => prev + 1);
      if (actionResponse?.isMatch) {
        setMatches((prev) => prev + 1);
      }
    }
  };

  const handleHomeSwipe = async (direction, profile) => {
    const profileId = profile?.id;
    const type = direction === "right" ? "like" : "pass";
    const actionResponse = await recordSwipeAction(profileId, type);

    updateStatsForSwipe(type, actionResponse);
    addHomeSwipedProfile(profileId);
    setHomeCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleHomeSuperLike = async (profile) => {
    const profileId = profile?.id;
    const actionResponse = await recordSwipeAction(profileId, "superlike");

    updateStatsForSwipe("superlike", actionResponse);
    addHomeSwipedProfile(profileId);
    setHomeCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  // Discover screen actions
  const addDiscoverSwipedProfile = (profileId) => {
    if (!profileId) return;
    setDiscoverSwipedProfiles((prev) => [...prev, profileId]);
  };

  const handleDiscoverSwipe = async (direction, profile) => {
    const profileId = profile?.id;
    const type = direction === "right" ? "like" : "pass";
    const actionResponse = await recordSwipeAction(profileId, type);

    updateStatsForSwipe(type, actionResponse);
    addDiscoverSwipedProfile(profileId);
    setDiscoverCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleDiscoverSuperLike = async (profile) => {
    const profileId = profile?.id;
    const actionResponse = await recordSwipeAction(profileId, "superlike");

    updateStatsForSwipe("superlike", actionResponse);
    addDiscoverSwipedProfile(profileId);
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
    profiles: profilesData,
    // Home screen
    homeCurrentProfileIndex: homeCurrentIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,
    handleSwipe: handleHomeSwipe,
    handleSuperLike: handleHomeSuperLike,

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
