import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DashboardLayout from "@/components/DashboardLayout";
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
  title: "Bio-Inspector",
  description: "Invasive Alien Species Monitoring",
  icons: {
    icon: "/Logo-Bio-Inspector.png",
    shortcut: "/Logo-Bio-Inspector.png",
    apple: "/Logo-Bio-Inspector.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
