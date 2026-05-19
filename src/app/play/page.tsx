"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGameStore } from "@/store/useGameStore";
import { useTimer } from "@/hooks/useTimer";
import { questions } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Award, Heart, Zap, ShieldAlert, Clock, ChevronRight, 
  RefreshCw, CheckCircle2, PlayCircle, Eye, ArrowRight
} from "lucide-react";

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
    resetGame,
  } = useGameStore();

  const { minutes, seconds, isExpired, progress } = useTimer(gameStartTime);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Path visualization states
  const [pathStep, setPathStep] = useState(0); // 1 to 6 represent active step, 7 = animation complete
  const [hasSeenPath, setHasSeenPath] = useState(false);
  const [skipButtonAvailable, setSkipButtonAvailable] = useState(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if no game session
  useEffect(() => {
    if (mounted && !gameStartTime) {
      router.push("/");
    }
  }, [mounted, gameStartTime, router]);

  // Submit results to API
  const submitResults = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);

    try {
      const timeTakenSeconds = gameStartTime 
        ? Math.floor((Date.now() - gameStartTime) / 1000)
        : 0;

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          groupName,
          answers,
          roundScores,
          timeTakenSeconds,
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
  }, [playerName, groupName, answers, roundScores, isSubmitting, isSubmitted, gameStartTime, setSubmitted]);

  // Auto-submit when all rounds complete or timer expires
  useEffect(() => {
    if (!mounted) return;
    if (isSubmitted) return;

    if (currentRound > TOTAL_ROUNDS || isExpired) {
      submitResults();
    }
  }, [mounted, currentRound, isExpired, isSubmitted, submitResults]);

  // Trigger path visualization sequence when game is submitted
  useEffect(() => {
    if (mounted && isSubmitted && !hasSeenPath) {
      setPathStep(1);
      setSkipButtonAvailable(false);
      
      const advancePath = () => {
        setPathStep((prev) => {
          if (prev >= 6) {
            if (animationTimerRef.current) clearInterval(animationTimerRef.current);
            return 7;
          }
          return prev + 1;
        });
      };

      animationTimerRef.current = setInterval(advancePath, 3000); // 3s per step to let users read their choice
      
      // Enable skip button after 5 seconds
      skipTimerRef.current = setTimeout(() => {
        setSkipButtonAvailable(true);
      }, 5000);
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, [mounted, isSubmitted, hasSeenPath]);

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
    }, 1600);
  };

  const handlePlayAgain = () => {
    resetGame();
    router.push("/");
  };

  if (!mounted || !gameStartTime) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="lq-shimmer h-8 w-48 rounded-lg" />
      </main>
    );
  }

  // --- 1. PATH VISUALIZATION SEQUENCE ---
  if (isSubmitted && !hasSeenPath && pathStep > 0) {
    const activeRoundInfo = questions.find((q) => q.round === pathStep);
    const activeAnswer = activeRoundInfo ? answers[String(activeRoundInfo.round)] : "";
    const activeScore = activeRoundInfo ? roundScores[String(activeRoundInfo.round)] : 0;
    const activeOption = activeRoundInfo?.options.find((opt) => opt.label === activeAnswer);
    const chosenText = activeOption ? activeOption.text : "No option selected (Expired)";
    const earnedScore = activeScore !== undefined ? activeScore : 0;

    return (
      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-2xl mx-auto w-full lq-fade-in">
        <div className="text-center mb-6">
          <Badge className="bg-primary/10 text-primary border-primary/20 tracking-widest uppercase text-[10px] px-3 py-1 font-bold mb-2">
            Decision Path Walkthrough
          </Badge>
          <h2 className="text-3xl font-heading font-extrabold tracking-wide">
            {pathStep === 7 ? "Analysis Complete!" : `Evaluating Round ${pathStep}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {pathStep === 7 ? "Your leadership characteristics have been mapped." : "Mapping decision impact on culture and delivery."}
          </p>
        </div>

        {/* Path Stage Card */}
        {pathStep <= 6 && activeRoundInfo ? (
          <Card className="lq-glass lq-glow-primary border-primary/20 overflow-hidden mb-6 lq-node-animate" key={pathStep}>
            {/* Visual Header Illustration */}
            <div className="relative w-full h-40 bg-secondary/20 border-b border-border/20">
              <Image
                src={activeRoundInfo.illustration}
                alt={activeRoundInfo.title}
                fill
                className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary/80">Round {pathStep}</span>
                <h3 className="text-xl font-heading font-bold text-foreground">{activeRoundInfo.title}</h3>
              </div>
            </div>
            <CardContent className="pt-5 space-y-4">
              <p className="text-xs text-muted-foreground/80 leading-relaxed italic">
                &ldquo;{activeRoundInfo.scenario}&rdquo;
              </p>
              
              <div className="bg-secondary/40 border border-border/30 rounded-xl p-4">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary shrink-0 mt-0.5">
                    {activeAnswer || "—"}
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Choice</p>
                    <p className="text-sm leading-relaxed text-foreground/90 font-medium">{chosenText}</p>
                  </div>
                </div>
              </div>

              {/* Decision Logged Confirmation */}
              <div className="flex items-center justify-between pt-2 border-t border-border/25">
                <span className="text-xs text-muted-foreground">Decision Vector Status</span>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">
                  Logged Successfully
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lq-glass lq-glow-secondary border-chart-2/20 text-center py-10 px-6 mb-6 lq-score-pop">
            <div className="relative w-20 h-20 mx-auto mb-4 rounded-full bg-chart-2/10 border border-chart-2/30 flex items-center justify-center shadow-[0_0_20px_oklch(0.72_0.15_220_/_0.2)]">
              <Award className="w-10 h-10 text-chart-2 animate-bounce" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-2">Simulation Fully Analyzed!</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your decisions have been evaluated. Let&apos;s see what type of leader you are.
            </p>
          </Card>
        )}

        {/* Metro-Line Nodes Walkthrough */}
        <div className="relative py-4 flex items-center justify-between px-2 mb-6">
          {/* Connector Line SVG */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-secondary/50 rounded-full z-0 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-cyan transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, ((pathStep - 1) / (TOTAL_ROUNDS - 1)) * 100)}%` }}
            />
          </div>

          {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
            const stepNum = idx + 1;
            const isCompleted = pathStep > stepNum || pathStep === 7;
            const isActive = pathStep === stepNum;
            const answerLetter = answers[String(stepNum)] || "—";
            const roundScore = roundScores[String(stepNum)] || 0;

            let badgeColor = "border-muted/50 bg-muted/20 text-muted-foreground";
            if (isActive) {
              badgeColor = "border-primary bg-primary/20 text-primary";
            } else if (isCompleted) {
              badgeColor = "border-cyan-500/40 bg-cyan-500/10 text-cyan-400";
            }

            return (
              <button
                key={stepNum}
                onClick={() => setPathStep(stepNum)}
                className={`relative z-10 flex flex-col items-center group transition-all duration-300 ${
                  isActive ? "scale-125" : "scale-100"
                }`}
              >
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black transition-all ${badgeColor} ${
                  isActive ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background shadow-[0_0_15px_oklch(0.65_0.22_250_/_0.3)]" : ""
                }`}>
                  {isCompleted ? answerLetter : stepNum}
                </span>
                <span className="text-[8px] font-bold mt-1 text-muted-foreground uppercase group-hover:text-foreground">
                  R{stepNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          {pathStep < 7 && (
            <Button
              variant="outline"
              onClick={() => setPathStep(7)}
              disabled={!skipButtonAvailable}
              className="flex-1 h-12 text-xs uppercase tracking-wider font-semibold border-border/40 hover:bg-secondary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {skipButtonAvailable ? "Skip Walkthrough" : "Skip in 5s..."}
            </Button>
          )}
          <Button
            onClick={() => setHasSeenPath(true)}
            disabled={pathStep < 7}
            className={`flex-1 h-12 text-xs uppercase tracking-widest font-bold font-heading rounded-xl cursor-pointer ${
              pathStep === 7 
                ? "bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:shadow-[0_0_20px_oklch(0.65_0.22_250_/_0.35)] animate-pulse" 
                : "bg-muted text-muted-foreground border border-border/20"
            }`}
          >
            Reveal Leadership Profile <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </main>
    );
  }

  // --- 2. FINAL LEADERSHIP PROFILE & RESULTS ---
  if (isSubmitted && (hasSeenPath || pathStep === 7)) {
    const totalScore = Object.values(roundScores).reduce((a, b) => a + b, 0);
    const maxPossible = TOTAL_ROUNDS * 100;

    // Determine Archetype
    let archetype = {
      title: "Crisis-Averse Administrator",
      icon: "ShieldAlert",
      glowClass: "lq-archetype-passive",
      textClass: "lq-text-passive",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      description: "You tend to avoid head-on conflicts, escalate problems immediately, or choose requirements without team alignment. This can lead to team confusion and lower accountability. You have great potential to develop by focusing on transparent communication and ownership.",
      strengths: ["Risk-aware", "Cautious", "Seeks external alignment"],
      development: "Practice taking personal accountability for team direction and addressing disagreements constructively."
    };

    if (totalScore >= 500) {
      archetype = {
        title: "Transformational Visionary",
        icon: "Award",
        glowClass: "lq-archetype-transformational",
        textClass: "lq-text-transformational",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        description: "You lead by inspiration, system design, and collaborative empowerment. You solve fundamental issues rather than pointing fingers, and you view team members' career transitions as development opportunities. You foster a highly resilient, high-trust environment.",
        strengths: ["Process-driven conflict resolution", "Systemic alignment", "Growth-oriented mindset"],
        development: "Ensure that you balance systemic changes with short-term deliverables when immediate turnaround is required."
      };
    } else if (totalScore >= 350) {
      archetype = {
        title: "Empathetic Collaborator",
        icon: "Heart",
        glowClass: "lq-archetype-servant",
        textClass: "lq-text-servant",
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        description: "You are a supportive leader who values team cohesion, employee satisfaction, and consensus. You defend your team members and support their transitions, though you sometimes prefer compromise when a firmer process direction is needed.",
        strengths: ["High empathy", "Strong relationship builder", "Conflict resolution through consensus"],
        development: "Sometimes direct executive action or structural guidelines are needed instead of searching for a middle-ground compromise."
      };
    } else if (totalScore >= 150) {
      archetype = {
        title: "Pragmatic Strategist",
        icon: "Zap",
        glowClass: "lq-archetype-transactional",
        textClass: "lq-text-transactional",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        description: "You are highly focused on execution, productivity, and getting results. When blockages occur, you make swift executive decisions or prioritize deliverable deadlines. While efficient, you may miss key opportunities to build trust or support long-term talent growth.",
        strengths: ["Highly decisive", "Goal-driven", "Rapid crisis intervention"],
        development: "Focus on establishing process alignment and listening to team concerns to prevent burnout and long-term turnover."
      };
    }

    const getArchetypeIcon = (iconName: string) => {
      switch (iconName) {
        case "Award": return <Award className="w-12 h-12 text-emerald-400" />;
        case "Heart": return <Heart className="w-12 h-12 text-violet-400" />;
        case "Zap": return <Zap className="w-12 h-12 text-amber-400" />;
        default: return <ShieldAlert className="w-12 h-12 text-rose-400" />;
      }
    };

    // Circular gauge configuration
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const normalizedScore = Math.max(0, Math.min(maxPossible, totalScore));
    const strokeDashoffset = circumference - (normalizedScore / maxPossible) * circumference;

    return (
      <main className="flex-1 flex flex-col px-4 py-8 max-w-3xl mx-auto w-full lq-fade-in">
        {/* Archetype Bento Box Summary Card */}
        <Card className={`lq-glass border p-6 mb-6 ${archetype.glowClass}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Custom SVG circular gauge */}
            <div className="flex flex-col items-center text-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-secondary/30"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="url(#archetype-gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="archetype-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--color-chart-2)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center flex flex-col justify-center items-center">
                  <span className="text-4xl font-heading font-black">{totalScore}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Points</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                out of {maxPossible} max possible
              </p>
            </div>

            {/* Right: Archetype profile details */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 ${archetype.badgeClass}`}>
                  Leadership Profile
                </Badge>
                <div className="text-xs text-muted-foreground font-medium">
                  {playerName} &bull; {groupName}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getArchetypeIcon(archetype.icon)}
                <h2 className={`text-3xl font-heading font-black tracking-wide ${archetype.textClass}`}>
                  {archetype.title}
                </h2>
              </div>
              
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {archetype.description}
              </p>
            </div>
          </div>
        </Card>

        {/* Strengths & Development Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="lq-glass border-border/30">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-xs uppercase tracking-wider text-primary font-bold">Key Leadership Strengths</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <ul className="space-y-2 text-sm">
                {archetype.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lq-glass border-border/30">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-xs uppercase tracking-wider text-chart-2 font-bold">Development Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                {archetype.development}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Decision Summary Path */}
        <Card className="lq-glass border-border/30 mb-6">
          <CardHeader className="pb-3 pt-5 border-b border-border/20">
            <CardTitle className="text-base font-heading font-bold text-foreground">Decision Summary Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {questions.map((q) => {
                const answerLetter = answers[String(q.round)] || "—";
                const roundScore = roundScores[String(q.round)] || 0;
                const chosenOption = q.options.find((opt) => opt.label === answerLetter);
                const isPositive = roundScore > 0;
                const isNegative = roundScore < 0;

                return (
                  <div key={q.round} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-secondary/15 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/30 shrink-0">
                        <Image
                          src={q.illustration}
                          alt={q.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary uppercase">Round {q.round}</span>
                          <span className="font-heading font-semibold text-sm text-foreground">{q.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed line-clamp-1">
                          {chosenOption ? chosenOption.text : "No option selected (Expired)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-secondary border border-border/50 text-xs font-black text-muted-foreground uppercase">
                        {answerLetter}
                      </span>
                      <span className={`text-sm font-heading font-bold ${
                        isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-muted-foreground"
                      }`}>
                        {isPositive ? "+" : ""}{roundScore} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Presenter Footer Info */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground/60 text-center sm:text-left">
            Results stored on cloud. Presenter will reveal the class metrics soon!
          </p>
          <Button
            onClick={handlePlayAgain}
            variant="outline"
            className="flex items-center gap-2 h-11 text-xs uppercase tracking-wider font-semibold border-border/40 hover:bg-secondary/20 cursor-pointer rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Replay Simulation
          </Button>
        </div>
      </main>
    );
  }

  // --- 3. SUBMITTING RESULTS SCREEN ---
  if (currentRound > TOTAL_ROUNDS || isExpired) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center lq-fade-in space-y-4">
          <div className="lq-shimmer h-3 w-48 rounded-full mx-auto" />
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">Analyzing responses & submitting results...</p>
        </div>
      </main>
    );
  }

  // --- 4. GAMEPLAY SCREEN ---
  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-3xl mx-auto w-full">
      {/* Top Bar: Player metadata + Time */}
      <div className="flex items-center justify-between mb-4 lq-fade-in">
        <div className="flex items-center gap-2">
          <Badge className="bg-secondary/50 text-foreground border-border/50 text-xs font-bold px-3 py-1 rounded-lg">
            {playerName}
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-black px-3 py-1 rounded-lg">
            {groupName}
          </Badge>
        </div>

        {/* Dynamic Timer display */}
        <div
          className={`font-mono text-2xl font-black tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary/20 border border-border/20 ${
            minutes === 0 && seconds <= 60 ? "lq-timer-critical" : "text-foreground"
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Progress Bar indicator */}
      <div className="mb-6 lq-fade-in">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          <span>
            Scenario {currentRound} of {TOTAL_ROUNDS}
          </span>
          <span>{Math.round(progress * 100)}% time elapsed</span>
        </div>
        <div className="h-2 bg-secondary/40 border border-border/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full lq-progress-fill"
            style={{ width: `${((currentRound - 1) / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario Illustration + Question Card */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col" key={currentRound}>
          <Card className="lq-glass mb-5 lq-fade-in border-border/40 overflow-hidden shadow-2xl relative">
            {/* AI Generated Scenario artwork image */}
            <div className="relative w-full h-48 bg-secondary/15">
              <Image
                src={currentQuestion.illustration}
                alt={currentQuestion.title}
                fill
                priority
                className="object-cover opacity-90 transition-transform duration-700 hover:scale-[1.02]"
              />
              {/* Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
              
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-heading font-black text-primary shadow-[0_0_15px_oklch(0.65_0.22_250_/_0.2)]">
                  {currentRound}
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Active Round</span>
                  <h2 className="text-xl font-heading font-extrabold tracking-wide text-foreground">{currentQuestion.title}</h2>
                </div>
              </div>
            </div>
            
            <CardContent className="pt-5 pb-6">
              <p className="text-[1.05rem] leading-relaxed text-foreground/90 font-medium">
                {currentQuestion.scenario}
              </p>
            </CardContent>
          </Card>

          {/* Staggered Options */}
          <div className="grid gap-3 lq-stagger">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.label;
              const optionColors: Record<string, string> = {
                A: "border-blue-500/20 text-blue-400 hover:border-blue-500/40",
                B: "border-sky-500/20 text-sky-400 hover:border-sky-500/40",
                C: "border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40",
                D: "border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40",
              };
              const labelColors: Record<string, string> = {
                A: "bg-blue-500/10 text-blue-300 border border-blue-500/20",
                B: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
                C: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
                D: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
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
                      : "bg-secondary/15"
                  } ${showFeedback && !isSelected ? "opacity-30 scale-[0.98]" : ""} disabled:cursor-not-allowed`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shrink-0 ${
                        labelColors[option.label] || ""
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="text-[13px] leading-relaxed font-semibold text-foreground/90">
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Overlay pop */}
          {showFeedback && (
            <div className="mt-6 text-center lq-score-pop">
              <div className="text-xl font-heading font-bold text-primary tracking-widest uppercase drop-shadow-sm flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                {currentRound < TOTAL_ROUNDS ? "Recording Choice..." : "Processing Final Matrix..."}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5">
                {currentRound < TOTAL_ROUNDS
                  ? "Aligning team vectors..."
                  : "Final responses saved!"}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
