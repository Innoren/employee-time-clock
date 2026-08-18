import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/geolocation",
    "@capacitor/status-bar",
    "@capacitor/splash-screen",
    "@capgo/background-geolocation",
  ],
};

export default nextConfig;
