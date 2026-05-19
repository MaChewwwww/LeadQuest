"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { questions } from "@/data/questions";

interface Submission {
  id: number;
  playerName: string;
  groupName: string;
  totalScore: number;
  answers: Record<string, string>;
  roundScores: Record<string, number>;
  completed: boolean;
  submittedAt: string;
  timeTakenSeconds?: number;
}

const TOTAL_ROUNDS = 6;
const CHART_COLORS = [
  "oklch(0.72 0.22 292)",   // violet
  "oklch(0.765 0.177 163)", // emerald
  "oklch(0.82 0.18 84)",    // amber
  "oklch(0.715 0.143 215)", // cyan
];

function getLeadershipArchetype(score: number) {
  if (score >= 500) {
    return {
      title: "Transformational Visionary",
      colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      color: "oklch(0.765 0.177 163)"
    };
  } else if (score >= 350) {
    return {
      title: "Empathetic Collaborator",
      colorClass: "border-violet-500/30 bg-violet-500/10 text-violet-400",
      color: "oklch(0.72 0.22 292)"
    };
  } else if (score >= 150) {
    return {
      title: "Pragmatic Strategist",
      colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      color: "oklch(0.82 0.18 84)"
    };
  } else {
    return {
      title: "Crisis-Averse Administrator",
      colorClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
      color: "oklch(0.70 0.18 20)"
    };
  }
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [revealedRounds, setRevealedRounds] = useState<Record<number, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const filteredSubmissions =
    selectedGroup === "All"
      ? submissions
      : submissions.filter((s) => s.groupName === selectedGroup);

  // Compute group leaderboard
  const groupLeaderboard = useMemo(() => {
    const stats: Record<string, { totalScore: number; count: number }> = {};
    filteredSubmissions.forEach((sub) => {
      if (!stats[sub.groupName]) {
        stats[sub.groupName] = { totalScore: 0, count: 0 };
      }
      stats[sub.groupName].totalScore += sub.totalScore;
      stats[sub.groupName].count += 1;
    });

    return Object.entries(stats)
      .map(([groupName, data]) => ({
        groupName,
        averageScore: Math.round(data.totalScore / data.count),
        players: data.count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [filteredSubmissions]);

  // Compute archetype distribution for the pie chart
  const archetypeDistribution = useMemo(() => {
    const counts = {
      "Transformational Visionary": 0,
      "Empathetic Collaborator": 0,
      "Pragmatic Strategist": 0,
      "Crisis-Averse Administrator": 0,
    };

    filteredSubmissions.forEach((sub) => {
      const arch = getLeadershipArchetype(sub.totalScore).title;
      counts[arch as keyof typeof counts] = (counts[arch as keyof typeof counts] || 0) + 1;
    });

    return [
      { name: "Transformational Visionary", value: counts["Transformational Visionary"], color: "oklch(0.765 0.177 163)" },
      { name: "Empathetic Collaborator", value: counts["Empathetic Collaborator"], color: "oklch(0.72 0.22 292)" },
      { name: "Pragmatic Strategist", value: counts["Pragmatic Strategist"], color: "oklch(0.82 0.18 84)" },
      { name: "Crisis-Averse Administrator", value: counts["Crisis-Averse Administrator"], color: "oklch(0.70 0.18 20)" },
    ].filter(item => item.value > 0);
  }, [filteredSubmissions]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/submissions");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-poll every 5 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchSubmissions]);

  // Handle passkey verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setError("Invalid passkey. Please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Get choice distribution for a round (optionally filtered by group)
  const getChoiceDistribution = (round: number, groupName?: string) => {
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    const subsToCount = groupName && groupName !== "All"
      ? submissions.filter((s) => s.groupName === groupName)
      : filteredSubmissions;

    subsToCount.forEach((sub) => {
      const answer = sub.answers?.[String(round)];
      if (answer && distribution[answer] !== undefined) {
        distribution[answer]++;
      }
    });

    return Object.entries(distribution).map(([label, count]) => ({
      label: `Option ${label}`,
      count,
      option: label,
    }));
  };

  // Get active groups to display based on global filter
  const getActiveGroups = (round: number) => {
    if (selectedGroup !== "All") return [selectedGroup];
    const groups = new Set<string>();
    submissions.forEach((sub) => {
      if (sub.answers?.[String(round)]) {
        groups.add(sub.groupName);
      }
    });
    return Array.from(groups).sort();
  };

  // Get submissions count for a round
  const getRoundSubmissions = (round: number) => {
    return filteredSubmissions.filter((sub) => sub.answers?.[String(round)]).length;
  };

  // Toggle reveal for a round
  const toggleReveal = (round: number) => {
    setRevealedRounds((prev) => ({ ...prev, [round]: !prev[round] }));
  };

  // ---- LOCKED STATE: Authentication ----
  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md lq-fade-in lq-glass lq-glow-primary border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/40 shadow-[0_0_20px_oklch(0.65_0.22_250_/_0.2)] mb-6 mx-auto">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-heading font-bold mb-2">Admin Access</CardTitle>
            <CardDescription>Enter the presenter passkey to view real-time results.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 text-center text-lg tracking-widest"
                  autoFocus
                />
                {error && <p className="text-destructive text-sm text-center font-medium mt-2">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={isVerifying || !passkey}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all font-heading tracking-wide"
              >
                {isVerifying ? "Verifying..." : "Access Dashboard →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ---- UNLOCKED STATE: Dashboard ----
  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 lq-fade-in">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              LeadQuest
            </span>
            <Badge variant="secondary" className="text-xs">
              Dashboard
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {lastRefresh
              ? `Last refresh: ${lastRefresh.toLocaleTimeString()}`
              : "Loading..."}
            {" • "}
            Auto-refreshing every 5s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedGroup} onValueChange={(val) => val && setSelectedGroup(val)}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Groups</SelectItem>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={`Group ${num}`}>
                  Group {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1.5 font-semibold"
          >
            {filteredSubmissions.length} Submissions
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubmissions}
            disabled={isRefreshing}
            className="cursor-pointer"
          >
            {isRefreshing ? (
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
            ) : (
              "↻ Refresh"
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="round-1" className="flex-1 lq-fade-in">
        <TabsList className="w-full justify-start gap-1 bg-secondary/30 p-1 rounded-xl mb-6 flex-wrap">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <TabsTrigger
              key={i + 1}
              value={`round-${i + 1}`}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer"
            >
              Round {i + 1}
            </TabsTrigger>
          ))}
          <TabsTrigger
            value="leaderboard"
            className="data-[state=active]:bg-emerald data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer"
          >
            🏆 Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Round Tabs */}
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
          const round = i + 1;
          const roundSubs = getRoundSubmissions(round);
          const isRevealed = revealedRounds[round] || false;
          const activeGroups = getActiveGroups(round);
          const currentQuestion = questions.find((q) => q.round === round);

          return (
            <TabsContent key={round} value={`round-${round}`}>
              <div className="space-y-6">
                {/* Round Header */}
                <div className="lq-glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-1">
                        Round {round} Results
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Total Responses:{" "}
                        <span className="font-semibold text-foreground">
                          {roundSubs}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label
                        htmlFor={`reveal-${round}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        {isRevealed ? "Hide Charts" : "Reveal Results"}
                      </Label>
                      <Switch
                        id={`reveal-${round}`}
                        checked={isRevealed}
                        onCheckedChange={() => toggleReveal(round)}
                      />
                    </div>
                  </div>
                </div>

                {/* Question Info */}
                {currentQuestion && (
                  <Card className="lq-glass border-border/60 shadow-lg shadow-black/20 lq-fade-in">
                    <CardHeader>
                      <CardTitle className="text-xl font-heading font-semibold text-foreground/90">{currentQuestion.scenario}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {currentQuestion.options.map(opt => (
                          <div key={opt.label} className="bg-secondary/40 p-4 rounded-xl flex items-start gap-4 border border-border/40 hover:border-border/80 transition-colors">
                            <Badge variant="default" className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30 border-none">{opt.label}</Badge>
                            <span className="text-[15px] leading-relaxed text-muted-foreground">
                              {opt.text}
                              {isRevealed && (
                                <span className="text-foreground ml-2 font-medium">
                                  ({opt.score} pts)
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts (revealed) */}
                {isRevealed && (
                  <div className="space-y-6 lq-fade-in">
                    {roundSubs === 0 ? (
                      <div className="lq-glass rounded-2xl p-6 text-center py-12 text-muted-foreground">
                        <p className="text-lg font-medium mb-1">
                          No responses yet
                        </p>
                        <p className="text-sm">
                          Waiting for students to complete this round...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Overall Chart */}
                        <Card className="lq-glass">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Overall Choice Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart
                                data={getChoiceDistribution(round)}
                                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="oklch(0.28 0.04 250)"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fill: "oklch(0.75 0.02 250)", fontSize: 13 }}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  tick={{ fill: "oklch(0.75 0.02 250)", fontSize: 13 }}
                                />
                                <Tooltip
                                  cursor={{ fill: "oklch(0.2 0.05 250 / 0.4)" }}
                                  contentStyle={{
                                    background: "oklch(0.16 0.03 250)",
                                    border: "1px solid oklch(0.28 0.04 250)",
                                    borderRadius: "12px",
                                    color: "oklch(0.98 0.01 250)",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                  }}
                                  itemStyle={{ fontWeight: 600, color: "var(--primary)" }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                  {getChoiceDistribution(round).map((_, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Group Breakdown Grid */}
                        {activeGroups.length > 1 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
                              Breakdown by Group
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                              {activeGroups.map(group => {
                                const chartData = getChoiceDistribution(round, group);
                                return (
                                  <Card key={group} className="lq-glass">
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-sm font-medium text-foreground">
                                        {group}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ResponsiveContainer width="100%" height={200}>
                                        <BarChart
                                          data={chartData}
                                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                                        >
                                          <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="oklch(0.28 0.04 250)"
                                          />
                                          <XAxis
                                            dataKey="label"
                                            tick={{ fill: "oklch(0.75 0.02 250)", fontSize: 11 }}
                                          />
                                          <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: "oklch(0.75 0.02 250)", fontSize: 11 }}
                                          />
                                          <Tooltip
                                            cursor={{ fill: "oklch(0.2 0.05 250 / 0.4)" }}
                                            contentStyle={{
                                              background: "oklch(0.16 0.03 250)",
                                              border: "1px solid oklch(0.28 0.04 250)",
                                              borderRadius: "12px",
                                              color: "oklch(0.98 0.01 250)",
                                              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                            }}
                                            itemStyle={{ fontWeight: 600, color: "var(--primary)" }}
                                          />
                                          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                            {chartData.map((_, index) => (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                              />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Suspense message when not revealed */}
                {!isRevealed && roundSubs > 0 && (
                  <div className="lq-glass rounded-2xl p-8 text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {roundSubs}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      responses collected — toggle &quot;Reveal Results&quot; to
                      show the distribution chart
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card className="lq-glass border-border/60 shadow-xl shadow-black/20">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <CardTitle className="text-2xl font-heading font-bold flex items-center gap-3">
                <span className="text-3xl">🏆</span> Final Leaderboard
              </CardTitle>
              <Badge variant="secondary" className="text-sm px-4 py-1.5 font-medium bg-primary/10 text-primary border-primary/20">
                {filteredSubmissions.length} Players
              </Badge>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium mb-1">No submissions yet</p>
                  <p className="text-sm">
                    Waiting for students to complete the game...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Archetype Distribution Pie Chart */}
                  <div className="lg:col-span-1">
                    <Card className="bg-secondary/15 border-border/30 p-5 rounded-2xl flex flex-col justify-between h-full shadow-md">
                      <div>
                        <h3 className="text-base font-heading font-bold text-foreground mb-1">
                          Leadership Profiles
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Distribution of leadership profiles within the selected filter.
                        </p>

                        {archetypeDistribution.length === 0 ? (
                          <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
                            No profiles generated yet
                          </div>
                        ) : (
                          <div className="relative h-48 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={archetypeDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {archetypeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    background: "oklch(0.16 0.03 250)",
                                    border: "1px solid oklch(0.28 0.04 250)",
                                    borderRadius: "12px",
                                    color: "oklch(0.98 0.01 250)",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Custom Legend */}
                      <div className="space-y-2.5 mt-4 pt-4 border-t border-border/20">
                        {archetypeDistribution.map((entry) => {
                          const pct = Math.round((entry.value / filteredSubmissions.length) * 100);
                          return (
                            <div key={entry.name} className="flex items-center justify-between text-xs font-semibold">
                              <div className="flex items-center gap-2 max-w-[70%]">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-muted-foreground truncate">{entry.name}</span>
                              </div>
                              <span className="text-foreground shrink-0">{entry.value} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column: Leaderboard Table */}
                  <div className="lg:col-span-2 space-y-4">
                    <Tabs defaultValue="individual" className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <TabsList className="grid w-[320px] grid-cols-2">
                          <TabsTrigger value="individual" className="text-xs">Individual Ranking</TabsTrigger>
                          <TabsTrigger value="group" className="text-xs">Group Averages</TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="individual" className="mt-0">
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-14 text-center font-semibold">Rank</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Group</TableHead>
                                <TableHead className="font-semibold">Leadership Profile</TableHead>
                                <TableHead className="font-semibold">Submitted</TableHead>
                                <TableHead className="font-semibold">Time Taken</TableHead>
                                <TableHead className="text-right font-semibold">Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredSubmissions.map((sub, index) => {
                                const timeStr = new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const mins = Math.floor((sub.timeTakenSeconds || 0) / 60);
                                const secs = (sub.timeTakenSeconds || 0) % 60;
                                const durationStr = sub.timeTakenSeconds ? `${mins}m ${secs}s` : "N/A";
                                const archetype = getLeadershipArchetype(sub.totalScore);

                                return (
                                  <TableRow
                                    key={sub.id}
                                    className="border-border/30 hover:bg-secondary/20 transition-colors"
                                  >
                                    <TableCell className="text-center">
                                      {index === 0 ? (
                                        <span className="text-lg">🥇</span>
                                      ) : index === 1 ? (
                                        <span className="text-lg">🥈</span>
                                      ) : index === 2 ? (
                                        <span className="text-lg">🥉</span>
                                      ) : (
                                        <span className="text-muted-foreground font-mono text-sm">
                                          {index + 1}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">{sub.playerName}</TableCell>
                                    <TableCell>
                                      <Badge variant="secondary" className="text-xs">{sub.groupName}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={`text-[10px] font-bold py-0.5 px-2 tracking-wide uppercase ${archetype.colorClass}`}>
                                        {archetype.title}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{timeStr}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{durationStr}</TableCell>
                                    <TableCell className="text-right">
                                      <span className={`font-bold font-mono ${index < 3 ? "text-primary" : ""}`}>
                                        {sub.totalScore}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>

                      <TabsContent value="group" className="mt-0">
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-16 text-center font-semibold">Rank</TableHead>
                                <TableHead className="font-semibold">Group</TableHead>
                                <TableHead className="font-semibold">Players</TableHead>
                                <TableHead className="text-right font-semibold">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupLeaderboard.map((group, index) => (
                                <TableRow
                                  key={group.groupName}
                                  className="border-border/30 hover:bg-secondary/20 transition-colors"
                                >
                                  <TableCell className="text-center">
                                    {index === 0 ? (
                                      <span className="text-lg">🥇</span>
                                    ) : index === 1 ? (
                                      <span className="text-lg">🥈</span>
                                    ) : index === 2 ? (
                                      <span className="text-lg">🥉</span>
                                    ) : (
                                      <span className="text-muted-foreground font-mono text-sm">
                                        {index + 1}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">{group.groupName}</TableCell>
                                  <TableCell>
                                    <span className="text-muted-foreground text-sm">{group.players}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`font-bold font-mono ${index < 3 ? "text-primary" : ""}`}>
                                      {group.averageScore}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
