import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreAuth } from "../slices/authSlice";

export const useAuthRestore = () => {
  const dispatch = useDispatch();

  const {
    authRestored,
    authLoading,
    token,
    onboardingToken,
    isAuthenticated,
    hasOnboardingSession,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!authRestored && !authLoading) {
      dispatch(restoreAuth());
    }
  }, [authRestored, authLoading, dispatch]);

  return {
    restored: authRestored,
    loading: authLoading,

    token,
    onboardingToken,

    isAuthenticated,
    hasOnboardingSession,
  };
};
