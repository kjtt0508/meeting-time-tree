import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meeting-timetree.vercel.app")
  .replace(/^﻿/, "").trim();

export const metadata: Metadata = {
  title: "Meeting Time Tree",
  description: "会議の記録を、プロジェクトの地図に変える。議事録カードをタイムライン上に配置し、線でつないで視覚的に管理するツール。",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Meeting Time Tree",
    description: "会議の記録を、プロジェクトの地図に変える。",
    url: APP_URL,
    siteName: "Meeting Time Tree",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meeting Time Tree",
    description: "会議の記録を、プロジェクトの地図に変える。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
