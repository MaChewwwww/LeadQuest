"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md lq-fade-in lq-glass lq-glow-primary border-primary/20 relative z-10">
        <CardHeader className="text-center pb-4 pt-8">
          {/* AI-Generated logo container */}
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_25px_oklch(0.65_0.22_250_/_0.25)] bg-background/50 flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="LeadQuest Logo"
              width={96}
              height={96}
              className="object-cover"
              priority
            />
          </div>
          
          <CardTitle className="text-5xl font-heading font-bold tracking-wider mb-2">
            <span className="bg-gradient-to-r from-primary via-chart-2 to-cyan bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              LeadQuest
            </span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 text-sm font-medium tracking-wide">
            Interactive Leadership Simulator
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="playerName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Full Name
              </Label>
              <Input
                id="playerName"
                type="text"
                placeholder="e.g. Commander Alex Mercer"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={100}
                required
                className="h-12 bg-secondary/35 border-border/40 focus:border-primary/60 transition-all placeholder:text-muted-foreground/40 text-sm font-medium rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="groupName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Group
              </Label>
              <Select value={groupName} onValueChange={(val) => val && setGroupName(val)} required>
                <SelectTrigger className="h-12 bg-secondary/35 border-border/40 focus:ring-primary/60 transition-all text-sm font-medium rounded-xl">
                  <SelectValue placeholder="Select your group number" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={`Group ${num}`} className="focus:bg-primary/20 text-sm font-medium">
                      Group {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !playerName.trim() || !groupName.trim()}
              className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_25px_oklch(0.65_0.22_250_/_0.3)] cursor-pointer text-primary-foreground font-heading tracking-widest uppercase rounded-xl mt-2"
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
                  Initializing...
                </span>
              ) : (
                "Begin Quest"
              )}
            </Button>
          </form>

          {/* Feature Quick list */}
          <div className="mt-8 pt-6 border-t border-border/30 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            <div className="flex flex-col items-center">
              <span className="text-primary text-sm mb-0.5">06</span>
              Rounds
            </div>
            <div className="flex flex-col items-center border-x border-border/20">
              <span className="text-chart-2 text-sm mb-0.5">15m</span>
              Global Time
            </div>
            <div className="flex flex-col items-center">
              <span className="text-cyan text-sm mb-0.5">Path</span>
              Animation
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/40 mt-6">
            Session saved locally. Safe to refresh during gameplay.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
