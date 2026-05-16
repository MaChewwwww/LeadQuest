import type { Metadata } from "next";
import { Outfit, Rajdhani } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadQuest — Leadership Simulator",
  description:
    "An interactive classroom leadership simulation game. Test your decision-making skills across 6 critical rounds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${rajdhani.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans lq-bg-gradient text-foreground bg-background">{children}</body>
    </html>
  );
}
