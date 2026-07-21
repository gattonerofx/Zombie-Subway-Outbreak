import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Zombie: Tokyo Subway Outbreak — 3D FPS",
  description:
    "Survive the zombie outbreak in a Tokyo subway station. A 3D first-person shooter built with Three.js & React Three Fiber.",
  keywords: ["zombie", "FPS", "3D game", "Tokyo subway", "Three.js", "React Three Fiber"],
  authors: [{ name: "gattonerofx" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
