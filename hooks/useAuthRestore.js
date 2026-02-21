import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreAuth } from "../slices/authSlice";

export const useAuthRestore = () => {
  const dispatch = useDispatch();
  const hasRequestedRestore = useRef(false);

  const {
    authRestored,
    authLoading,
    token,
    onboardingToken,
    isAuthenticated,
    hasOnboardingSession,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!authRestored && !hasRequestedRestore.current) {
      hasRequestedRestore.current = true;
      dispatch(restoreAuth());
    }
  }, [authRestored, dispatch]);

  return {
    restored: authRestored,
    loading: authLoading,

    token,
    onboardingToken,

    isAuthenticated,
    hasOnboardingSession,
  };
};
