import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreAuth } from "../slices/authSlice";

export const useAuthRestore = () => {
  const dispatch = useDispatch();
  const { token, onboardingToken, authRestored } = useSelector(
    (state) => state.auth
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // Trigger restoration if not already done
    if (!authRestored) {
      dispatch(restoreAuth());
    } else {
      setRestored(true);
    }
  }, [authRestored, dispatch]);

  return {
    restored,
    token,
    onboardingToken,
  };
};
