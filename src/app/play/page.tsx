"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import { useTimer } from "@/hooks/useTimer";
import { questions } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOTAL_ROUNDS = 6;

export default function PlayPage() {
  const router = useRouter();
  const {
    playerName,
    groupName,
    currentRound,
    gameStartTime,
    answers,
    roundScores,
    isSubmitted,
    submitAnswer,
    setSubmitted,
  } = useGameStore();

  const { minutes, seconds, isExpired, progress } = useTimer(gameStartTime);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if no game session
  useEffect(() => {
    if (mounted && !gameStartTime) {
      router.push("/");
    }
  }, [mounted, gameStartTime, router]);

  // Redirect if already submitted
  useEffect(() => {
    if (mounted && isSubmitted) {
      // Stay on page to show completion screen
    }
  }, [mounted, isSubmitted]);

  // Submit results to API
  const submitResults = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          groupName,
          answers,
          roundScores,
        }),
      });

      if (response.ok) {
        setSubmitted();
      } else {
        console.error("Submit failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [playerName, groupName, answers, roundScores, isSubmitting, isSubmitted, setSubmitted]);

  // Auto-submit when all rounds complete or timer expires
  useEffect(() => {
    if (!mounted) return;
    if (isSubmitted) return;

    if (currentRound > TOTAL_ROUNDS || isExpired) {
      submitResults();
    }
  }, [mounted, currentRound, isExpired, isSubmitted, submitResults]);

  const currentQuestion = questions.find((q) => q.round === currentRound);

  const handleSelectOption = (label: string, score: number) => {
    if (showFeedback) return;
    setSelectedOption(label);
    setFeedbackScore(score);
    setShowFeedback(true);

    // Auto-advance after showing feedback
    setTimeout(() => {
      submitAnswer(currentRound, label, score);
      setSelectedOption(null);
      setShowFeedback(false);
      setFeedbackScore(0);
    }, 1500);
  };

  if (!mounted || !gameStartTime) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="lq-shimmer h-8 w-48 rounded-lg" />
      </main>
    );
  }

  // Completion screen
  if (isSubmitted) {
    const totalScore = Object.values(roundScores).reduce((a, b) => a + b, 0);
    const maxPossible = TOTAL_ROUNDS * 100;

    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center lq-fade-in">
          <div className="lq-glass rounded-2xl p-10 lq-glow-secondary">
            {/* Trophy icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-chart-2/10 border border-chart-2/20 mb-6 shadow-[0_0_20px_oklch(0.72_0.15_220_/_0.2)]">
              <svg
                className="w-10 h-10 text-chart-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 3h14l-1.405 8.426A2 2 0 0115.612 13H8.388a2 2 0 01-1.983-1.574L5 3zm0 0l-1 2m16-2l1 2M12 13v4m-4 4h8m-4-4v4"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-heading font-bold mb-2">Quest Complete!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Great work, <span className="text-foreground font-medium">{playerName}</span>!
            </p>

            <div className="lq-score-pop">
              <div className="text-7xl font-heading font-bold bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent mb-2 drop-shadow-sm">
                {totalScore}
              </div>
              <p className="text-sm text-muted-foreground">
                out of {maxPossible} possible points
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="text-muted-foreground mb-1">Group</div>
                <div className="font-semibold">{groupName}</div>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="text-muted-foreground mb-1">Rounds</div>
                <div className="font-semibold">
                  {Object.keys(answers).length} / {TOTAL_ROUNDS}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 mt-8">
              Your results have been submitted. Wait for the presenter to reveal
              the leaderboard!
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Submitting screen
  if (currentRound > TOTAL_ROUNDS || isExpired) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center lq-fade-in">
          <div className="lq-shimmer h-3 w-48 rounded-full mb-4 mx-auto" />
          <p className="text-muted-foreground">Submitting your results...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-3xl mx-auto w-full">
      {/* Top Bar: Timer + Progress */}
      <div className="flex items-center justify-between mb-6 lq-fade-in">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            {playerName}
          </Badge>
          <Badge variant="outline" className="text-xs px-3 py-1">
            {groupName}
          </Badge>
        </div>

        {/* Timer */}
        <div
          className={`font-mono text-2xl font-bold tracking-wider ${
            minutes === 0 && seconds <= 60 ? "lq-timer-critical" : "text-foreground"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 lq-fade-in">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>
            Round {currentRound} of {TOTAL_ROUNDS}
          </span>
          <span>{Math.round(progress * 100)}% time elapsed</span>
        </div>
        <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-chart-2 to-primary rounded-full lq-progress-fill"
            style={{ width: `${(currentRound - 1) / TOTAL_ROUNDS * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col" key={currentRound}>
          {/* Scenario */}
          <div className="lq-glass rounded-2xl p-6 mb-6 lq-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-lg font-heading font-bold text-primary shadow-[0_0_15px_oklch(0.65_0.22_250_/_0.2)]">
                {currentRound}
              </div>
              <h2 className="text-base font-heading font-medium text-muted-foreground tracking-wide">
                Leadership Scenario
              </h2>
            </div>
            <p className="text-[1.1rem] leading-relaxed text-foreground/90 font-medium">{currentQuestion.scenario}</p>
          </div>

          {/* Options */}
          <div className="grid gap-3 lq-stagger">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.label;
              const optionColors: Record<string, string> = {
                A: "border-blue-500/30 hover:border-blue-500/60",
                B: "border-sky-500/30 hover:border-sky-500/60",
                C: "border-indigo-500/30 hover:border-indigo-500/60",
                D: "border-cyan-500/30 hover:border-cyan-500/60",
              };
              const labelColors: Record<string, string> = {
                A: "bg-blue-500/10 text-blue-400",
                B: "bg-sky-500/10 text-sky-400",
                C: "bg-indigo-500/10 text-indigo-400",
                D: "bg-cyan-500/10 text-cyan-400",
              };

              return (
                <button
                  key={option.label}
                  onClick={() => handleSelectOption(option.label, option.score)}
                  disabled={showFeedback}
                  className={`lq-option-btn w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                    optionColors[option.label] || ""
                  } ${
                    isSelected
                      ? "selected border-primary bg-primary/10"
                      : "bg-secondary/20"
                  } ${showFeedback && !isSelected ? "opacity-40" : ""} disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0 ${
                        labelColors[option.label] || ""
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-sm leading-relaxed">
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Score Feedback */}
          {showFeedback && (
            <div className="mt-6 text-center lq-score-pop">
              <div
                className={`text-4xl font-heading font-bold tracking-wide drop-shadow-sm ${
                  feedbackScore > 0
                    ? "text-chart-2"
                    : feedbackScore < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {feedbackScore > 0 ? "+" : ""}
                {feedbackScore} pts
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentRound < TOTAL_ROUNDS
                  ? "Next round loading..."
                  : "Final round complete!"}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
