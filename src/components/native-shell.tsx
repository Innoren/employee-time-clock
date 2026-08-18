"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function NativeShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: Style.Dark }))
      .catch(() => {});
    void import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide())
      .catch(() => {});
  }, []);
  return null;
}
