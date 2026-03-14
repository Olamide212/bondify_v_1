/**
 * OfflineBanner.jsx
 *
 * Shows a toast notification once when the device goes offline,
 * and again once when it comes back online.
 *
 * Usage: Mount once near the root of your app (e.g. inside app/_layout.jsx).
 */

import { useEffect, useRef } from "react";
import { useToast } from "../../context/ToastContext";

const CHECK_INTERVAL_MS = 5000; // re-check every 5 s
const CHECK_URL = "https://www.google.com/generate_204";
const CHECK_TIMEOUT_MS = 3000;

async function isOnline() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(CHECK_URL, { method: "HEAD", signal: controller.signal });
    clearTimeout(id);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

const OfflineBanner = () => {
  const { showToast } = useToast();
  const prevOffline = useRef(null); // null = status not yet known

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      const online = await isOnline();
      if (!isMounted) return;

      const isOffline = !online;

      // Only trigger a toast when the status changes (not on every interval tick)
      if (prevOffline.current !== isOffline) {
        prevOffline.current = isOffline;

        if (isOffline) {
          showToast({ message: "Network unstable", variant: "error" });
        } else if (prevOffline.current !== null) {
          // Only show "back online" if we previously knew we were offline
          showToast({ message: "You are back online", variant: "success" });
        }
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showToast]);

  return null; // This component renders nothing — it only triggers toasts
};

export default OfflineBanner;