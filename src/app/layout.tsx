import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Masters Tracker | Master's Degree Progress Tracker",
  description: "Track your master's degree progress with visual orbital course maps, semester planning, and smart suggestions.",
  keywords: ["master's degree", "progress tracker", "course planning", "university", "academic"],
  authors: [{ name: "Masters Tracker" }],
  openGraph: {
    title: "Masters Tracker",
    description: "Track your master's degree progress with visual orbital course maps",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}