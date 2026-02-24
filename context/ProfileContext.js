import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  const DEFAULT_HOME_FILTERS = {
    showMe: "everyone",
    ageRange: [18, 90],
    maxDistance: 1000,
    interests: [],
    verifiedOnly: false,
    activeToday: false,
    location: "",
  };

  // Global stats
  const [matches, setMatches] = useState(0);
  const [likes, setLikes] = useState(0);
  const [profilesData, setProfilesData] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesRefreshNonce, setProfilesRefreshNonce] = useState(0);
  const [homeFilters, setHomeFilters] = useState(DEFAULT_HOME_FILTERS);

  // Separate states for home and discover screens
  const [homeSwipedProfiles, setHomeSwipedProfiles] = useState([]);
  const [discoverSwipedProfiles, setDiscoverSwipedProfiles] = useState([]);
  const [homeCurrentIndex, setHomeCurrentIndex] = useState(0);
  const [discoverCurrentIndex, setDiscoverCurrentIndex] = useState(0);

  const [matchCelebration, setMatchCelebration] = useState(null);

  const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
      .map((image) => {
        if (typeof image === "string") return image;
        if (!image || typeof image !== "object") return null;
        return (
          image.url ||
          image.uri ||
          image.secure_url ||
          image.imageUrl ||
          image.image ||
          image.src ||
          null
        );
      })
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
    const normalizedName =
      profile?.name ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      profile?.username ||
      "Unknown";

    return {
      id: profile?._id ?? profile?.id,
      name: normalizedName,
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

  // Convert homeFilters into query params accepted by the backend
  const buildApiParams = useCallback((filters) => {
    const params = {};
    const [minAge, maxAge] = filters.ageRange || [18, 90];
    if (minAge && minAge !== 18) params.minAge = minAge;
    if (maxAge && maxAge !== 90) params.maxAge = maxAge;

    if (filters.showMe && filters.showMe !== "everyone") {
      const genderMap = { men: "Male", women: "Female" };
      const gender = genderMap[String(filters.showMe).toLowerCase()];
      if (gender) params.gender = gender;
    }

    if (filters.maxDistance && filters.maxDistance < 1000) {
      params.maxDistance = filters.maxDistance;
    }

    if (Array.isArray(filters.interests) && filters.interests.length > 0) {
      params.interests = filters.interests;
    }

    if (filters.verifiedOnly) params.verifiedOnly = true;
    if (filters.activeToday) params.activeToday = true;
    if (filters.location && filters.location.trim()) {
      params.location = filters.location.trim();
    }

    return params;
  }, []);

  // Track whether this is the first render so we can skip the redundant
  // refetch that would otherwise fire when homeFilters is still at its
  // default value.
  const isFirstRender = useRef(true);

  const refreshProfiles = useCallback(() => {
    setProfilesRefreshNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      if (isMounted) setProfilesLoading(true);

      try {
        let page = 1;
        let totalPages = 1;
        const allProfiles = [];
        const apiParams = buildApiParams(homeFilters);

        while (page <= totalPages) {
          const response = await profileService.getDiscoveryProfiles(
            { ...apiParams, page, limit: 100 },
            { includePagination: true }
          );

          const pageProfiles = Array.isArray(response?.profiles)
            ? response.profiles
            : [];

          allProfiles.push(...pageProfiles);
          totalPages = response?.pagination?.pages || page;

          if (!response?.pagination) {
            break;
          }

          page += 1;
        }

        const normalizedProfiles = allProfiles.map(normalizeProfile);
        if (isMounted) {
          setProfilesData(normalizedProfiles);
          // Reset index when fresh profiles are loaded after a filter change
          if (!isFirstRender.current) {
            setHomeCurrentIndex(0);
          }
        }
      } catch (error) {
        if (isMounted) {
          setProfilesData([]);
        }
      } finally {
        if (isMounted) {
          setProfilesLoading(false);
          isFirstRender.current = false;
        }
      }
    };

    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [homeFilters, buildApiParams, profilesRefreshNonce]);

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
      console.error("Swipe action failed:", { profileId, type, error });
      return null;
    }
  };

  const updateStatsForSwipe = (type, actionResponse, swipedProfile) => {
    if (!actionResponse) return;
    if (type === "like" || type === "superlike") {
      setLikes((prev) => prev + 1);
      if (actionResponse?.isMatch) {
        setMatches((prev) => prev + 1);
        // Trigger match celebration modal
        const matchedProfile = {
          ...swipedProfile,
          matchId:
            actionResponse?.match?._id ||
            actionResponse?.match?.id ||
            swipedProfile?.matchId,
          images:
            actionResponse?.likedUser?.images?.length > 0
              ? actionResponse.likedUser.images
              : swipedProfile?.images || [],
        };
        setMatchCelebration(matchedProfile);
      }
    }
  };

  const handleHomeSwipe = async (direction, profile) => {
    const profileId = profile?.id;
    const type = direction === "right" ? "like" : "pass";
    const actionResponse = await recordSwipeAction(profileId, type);

    updateStatsForSwipe(type, actionResponse, profile);
    addHomeSwipedProfile(profileId);
    setHomeCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleHomeSuperLike = async (profile) => {
    const profileId = profile?.id;
    const actionResponse = await recordSwipeAction(profileId, "superlike");

    updateStatsForSwipe("superlike", actionResponse, profile);
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

    updateStatsForSwipe(type, actionResponse, profile);
    addDiscoverSwipedProfile(profileId);
    setDiscoverCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  const handleDiscoverSuperLike = async (profile) => {
    const profileId = profile?.id;
    const actionResponse = await recordSwipeAction(profileId, "superlike");

    updateStatsForSwipe("superlike", actionResponse, profile);
    addDiscoverSwipedProfile(profileId);
    setDiscoverCurrentIndex((prev) => (prev + 1) % profilesData.length);
  };

  // Filter profiles for each screen
  const parseDistance = (distance) => {
    if (typeof distance === "number") return distance;
    const parsed = Number.parseFloat(String(distance || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const homeProfiles = profilesData
    .filter((profile) => !homeSwipedProfiles.includes(profile.id))
    .filter((profile) => {
      const [minAge, maxAge] = homeFilters.ageRange || [18, 90];
      const profileAge = Number(profile?.age);
      if (Number.isFinite(profileAge) && (profileAge < minAge || profileAge > maxAge)) {
        return false;
      }

      if (homeFilters.showMe && homeFilters.showMe !== "everyone") {
        const genderMap = {
          men: "Male",
          women: "Female",
        };

        const expectedGender = genderMap[String(homeFilters.showMe).toLowerCase()];
        if (
          expectedGender &&
          profile?.gender !== expectedGender
        ) {
          return false;
        }
      }

      if (homeFilters.maxDistance) {
        const profileDistance = parseDistance(profile?.distance);
        if (
          profileDistance !== null &&
          profileDistance > Number(homeFilters.maxDistance)
        ) {
          return false;
        }
      }

      if (Array.isArray(homeFilters.interests) && homeFilters.interests.length > 0) {
        const profileInterests = Array.isArray(profile?.interests)
          ? profile.interests.map((interest) => String(interest).toLowerCase())
          : [];
        const hasInterestMatch = homeFilters.interests.some((interest) =>
          profileInterests.includes(String(interest).toLowerCase())
        );

        if (!hasInterestMatch) {
          return false;
        }
      }

      if (homeFilters.verifiedOnly && !profile?.verified) {
        return false;
      }

      if (homeFilters.activeToday) {
        const lastActiveValue = profile?.lastActive;
        const isStringActiveToday = String(lastActiveValue || "")
          .toLowerCase()
          .includes("today");

        let isDateActiveToday = false;
        if (lastActiveValue) {
          const parsedDate = new Date(lastActiveValue);
          if (!Number.isNaN(parsedDate.getTime())) {
            const now = new Date();
            isDateActiveToday =
              parsedDate.getFullYear() === now.getFullYear() &&
              parsedDate.getMonth() === now.getMonth() &&
              parsedDate.getDate() === now.getDate();
          }
        }

        if (!isStringActiveToday && !isDateActiveToday) {
          return false;
        }
      }

      // Location-based filtering
      if (homeFilters.location && homeFilters.location.trim()) {
        const filterLocation = homeFilters.location.trim().toLowerCase();
        const profileLocation = String(profile?.location || "").toLowerCase();
        if (!profileLocation.includes(filterLocation)) {
          return false;
        }
      }

      return true;
    });

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
    profilesLoading,
    refreshProfiles,
    homeFilters,
    setHomeFilters,

    // Match celebration
    matchCelebration,
    setMatchCelebration,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};
