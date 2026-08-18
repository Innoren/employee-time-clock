import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

function extraHosts(url: string) {
  try {
    const host = new URL(url).hostname;
    return host ? [host] : [];
  } catch {
    return [];
  }
}

const config: CapacitorConfig = {
  appId: "com.sinclairatelier.timeclock",
  appName: "Time Clock",
  webDir: "native-www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: ["localhost", "*.vercel.app", "*.local", ...extraHosts(serverUrl)],
  },
  android: {
    backgroundColor: "#0a0a0a",
    // Keeps the Capacitor bridge alive so shift GPS can continue in the background.
    useLegacyBridge: true,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0a",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
