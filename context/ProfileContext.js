import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { profileService } from "../services/profileService";
import { socketService } from "../services/socketService";
import { tokenManager } from "../utils/tokenManager";

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

  const [matches, setMatches] = useState(0);
  const [likes, setLikes] = useState(0);
  const [profilesData, setProfilesData] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesRefreshNonce, setProfilesRefreshNonce] = useState(0);
  const [homeFilters, setHomeFilters] = useState(DEFAULT_HOME_FILTERS);
  const [homeSwipedProfiles, setHomeSwipedProfiles] = useState([]);
  const [discoverSwipedProfiles, setDiscoverSwipedProfiles] = useState([]);
  const [homeCurrentIndex, setHomeCurrentIndex] = useState(0);
  const [discoverCurrentIndex, setDiscoverCurrentIndex] = useState(0);
  const [matchCelebration, setMatchCelebration] = useState(null);

  // ✅ Watch the auth state so we know when the user is fully logged in
  const authUser = useSelector((state) => state.auth.user);
  const currentUserId = authUser?.id ?? authUser?._id ?? null;

  const normalizeProfileRef = useRef(null);

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
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(", ");
  };

  const normalizeProfile = useCallback((profile) => {
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
  }, []);

  useEffect(() => {
    normalizeProfileRef.current = normalizeProfile;
  }, [normalizeProfile]);

  // Socket listener — registered once on mount
  useEffect(() => {
    let isMounted = true;

    const handleMatchNew = (data) => {
      if (!isMounted || !data) return;
      const normalize = normalizeProfileRef.current;
      if (!normalize) return;

      const matchedProfile = {
        ...normalize(data?.matchedUser || data?.profile || {}),
        matchId: data?.matchId || data?.match?._id || data?.match?.id,
      };

      setTimeout(() => {
        if (isMounted) setMatchCelebration(matchedProfile);
      }, 100);
    };

    const setupSocket = async () => {
      const socket = await socketService.connect();
      if (!socket || !isMounted) return;
      socketService.off("match:new", handleMatchNew);
      socketService.on("match:new", handleMatchNew);
    };

    setupSocket();

    return () => {
      isMounted = false;
      socketService.off("match:new", handleMatchNew);
    };
  }, []);

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

  const isFirstRender = useRef(true);

  const refreshProfiles = useCallback(() => {
    setHomeSwipedProfiles([]);
    setDiscoverSwipedProfiles([]);
    setHomeCurrentIndex(0);
    setDiscoverCurrentIndex(0);
    setProfilesRefreshNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // ✅ Wait for token to be available before fetching — this is the core fix
    // for new users not seeing profiles until they pull to refresh
    const waitForToken = async (retries = 10, delayMs = 300) => {
      for (let i = 0; i < retries; i++) {
        const token = await tokenManager.getToken();
        if (token) return token;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return null;
    };

    const loadProfiles = async () => {
      if (isMounted) setProfilesLoading(true);

      try {
        // ✅ Block until the auth token is actually available in storage
        const token = await waitForToken();
        if (!token || !isMounted) {
          if (isMounted) setProfilesLoading(false);
          return;
        }

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

          if (!response?.pagination) break;

          page += 1;
        }

        const normalizedProfiles = allProfiles.map(normalizeProfile);
        if (isMounted) {
          setProfilesData(normalizedProfiles);
          if (!isFirstRender.current) setHomeCurrentIndex(0);
        }
      } catch (error) {
        if (isMounted) setProfilesData([]);
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

  // ✅ currentUserId added as a dependency — when a new user logs in and the
  // Redux auth state updates, this effect re-runs and fetches their profiles
  }, [homeFilters, buildApiParams, profilesRefreshNonce, currentUserId]);

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
      if (error?.message?.toLowerCase().includes("already interacted")) {
        addHomeSwipedProfile(profileId);
      }
      return null;
    }
  };

  const updateStatsForSwipe = (type, actionResponse, swipedProfile) => {
    if (!actionResponse) return;
    if (type === "like" || type === "superlike") {
      setLikes((prev) => prev + 1);
      if (actionResponse?.isMatch) {
        setMatches((prev) => prev + 1);
        setMatchCelebration((prev) => {
          if (prev) return prev;
          return {
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
        });
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
      if (Number.isFinite(profileAge) && (profileAge < minAge || profileAge > maxAge)) return false;

      if (homeFilters.showMe && homeFilters.showMe !== "everyone") {
        const genderMap = { men: "Male", women: "Female" };
        const expectedGender = genderMap[String(homeFilters.showMe).toLowerCase()];
        if (
          expectedGender &&
          String(profile?.gender || "").toLowerCase() !== expectedGender.toLowerCase()
        )
          return false;
      }

      if (homeFilters.maxDistance) {
        const profileDistance = parseDistance(profile?.distance);
        if (profileDistance !== null && profileDistance > Number(homeFilters.maxDistance)) return false;
      }

      if (Array.isArray(homeFilters.interests) && homeFilters.interests.length > 0) {
        const profileInterests = Array.isArray(profile?.interests)
          ? profile.interests.map((i) => String(i).toLowerCase())
          : [];
        const hasInterestMatch = homeFilters.interests.some((i) =>
          profileInterests.includes(String(i).toLowerCase())
        );
        if (!hasInterestMatch) return false;
      }

      if (homeFilters.verifiedOnly && !profile?.verified) return false;

      if (homeFilters.activeToday) {
        const lastActiveValue = profile?.lastActive;
        const isStringActiveToday = String(lastActiveValue || "").toLowerCase().includes("today");
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
        if (!isStringActiveToday && !isDateActiveToday) return false;
      }

      if (homeFilters.location && homeFilters.location.trim()) {
        const filterLocation = homeFilters.location.trim().toLowerCase();
        const profileLocation = String(profile?.location || "").toLowerCase();
        if (!profileLocation.includes(filterLocation)) return false;
      }

      return true;
    });

  const discoverProfiles = profilesData.filter(
    (profile) => !discoverSwipedProfiles.includes(profile.id)
  );

  const value = {
    profiles: profilesData,
    homeCurrentProfileIndex: homeCurrentIndex,
    homeProfiles,
    handleHomeSwipe,
    handleHomeSuperLike,
    handleSwipe: handleHomeSwipe,
    handleSuperLike: handleHomeSuperLike,
    discoverCurrentProfileIndex: discoverCurrentIndex,
    discoverProfiles,
    handleDiscoverSwipe,
    handleDiscoverSuperLike,
    matches,
    likes,
    setHomeCurrentIndex,
    setDiscoverCurrentIndex,
    profilesLoading,
    refreshProfiles,
    homeFilters,
    setHomeFilters,
    matchCelebration,
    setMatchCelebration,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};