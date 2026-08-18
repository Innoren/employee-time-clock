import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NativeShell } from "@/components/native-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Time Clock", template: "%s · Time Clock" },
  description:
    "Employee time tracking for Complete Doors and Hardware. Clock in from any iPhone or Android.",
  applicationName: "Time Clock",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Time Clock",
  },
  formatDetection: { telephone: false },
  icons: { apple: "/apple-icon" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NativeShell />
        {children}
      </body>
    </html>
  );
}
