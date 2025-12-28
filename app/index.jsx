import React, { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Always show splash first
    router.replace("/splash-screen");
  }, []);

  return null;
}
