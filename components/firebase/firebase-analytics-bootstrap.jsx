"use client";

import { useEffect } from "react";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase/client";
import { getAnalytics, isSupported } from "firebase/analytics";

export function FirebaseAnalyticsBootstrap() {
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!isFirebaseConfigured()) return;

      const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
      if (!measurementId) return;

      const supported = await isSupported().catch(() => false);
      if (!mounted || !supported) return;

      getAnalytics(getFirebaseApp());
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
