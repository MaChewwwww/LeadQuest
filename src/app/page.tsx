"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const { gameStartTime, isSubmitted, startGame } = useGameStore();
  const [playerName, setPlayerName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect if game is already in progress
  useEffect(() => {
    if (mounted && gameStartTime && !isSubmitted) {
      router.push("/play");
    }
  }, [mounted, gameStartTime, isSubmitted, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !groupName.trim()) return;

    setIsLoading(true);
    startGame(playerName.trim(), groupName.trim());
    router.push("/play");
  };

  if (!mounted) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="lq-shimmer h-8 w-48 rounded-lg" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md lq-fade-in">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/40 shadow-[0_0_20px_oklch(0.65_0.22_250_/_0.2)] mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-heading font-bold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent drop-shadow-sm">
              LeadQuest
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Leadership Simulation &bull; 6 Rounds &bull; 15 Minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="lq-glass rounded-2xl p-8 lq-glow-primary border border-primary/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-sm font-medium">
                Your Name
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Enter your full name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={100}
                required
                className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-sm font-medium">
                Group Number
              </Label>
              <Select value={groupName} onValueChange={(val) => val && setGroupName(val)} required>
                <SelectTrigger className="h-12 bg-secondary/50 border-border/50 focus:ring-primary/50 transition-colors">
                  <SelectValue placeholder="Select your group" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={`Group ${num}`}>
                      Group {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !playerName.trim() || !groupName.trim()}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_30px_oklch(0.65_0.22_250_/_0.3)] cursor-pointer text-primary-foreground font-heading tracking-wide"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Starting...
                </span>
              ) : (
                "Begin Quest →"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Your progress is saved locally. You can safely refresh the page.
          </p>
        </div>
      </div>
    </main>
  );
}
