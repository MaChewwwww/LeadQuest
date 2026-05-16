"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Submission {
  id: number;
  playerName: string;
  groupName: string;
  totalScore: number;
  answers: Record<string, string>;
  roundScores: Record<string, number>;
  completed: boolean;
  submittedAt: string;
}

const TOTAL_ROUNDS = 6;
const CHART_COLORS = [
  "oklch(0.72 0.22 292)",   // violet
  "oklch(0.765 0.177 163)", // emerald
  "oklch(0.82 0.18 84)",    // amber
  "oklch(0.715 0.143 215)", // cyan
];

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

  const filteredSubmissions = submissions.filter(
    (sub) => selectedGroup === "All" || sub.groupName === selectedGroup
  );

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

  // Get choice distribution for a round
  const getChoiceDistribution = (round: number) => {
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    filteredSubmissions.forEach((sub) => {
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
        <div className="w-full max-w-sm lq-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <svg
                className="w-7 h-7 text-primary"
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
            <h1 className="text-2xl font-bold mb-1">Presenter Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Enter the admin passkey to continue
            </p>
          </div>

          <div className="lq-glass rounded-2xl p-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passkey" className="text-sm">
                  Passkey
                </Label>
                <Input
                  id="passkey"
                  type="password"
                  placeholder="Enter admin passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="h-11 bg-secondary/50 border-border/50"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                disabled={isVerifying || !passkey.trim()}
                className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 cursor-pointer"
              >
                {isVerifying ? "Verifying..." : "Unlock Dashboard"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ---- UNLOCKED STATE: Dashboard ----
  return (
    <main className="flex-1 flex flex-col px-4 py-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 lq-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
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
          const chartData = getChoiceDistribution(round);

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

                {/* Chart (revealed) */}
                {isRevealed && (
                  <div className="lq-glass rounded-2xl p-6 lq-fade-in">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">
                      Choice Distribution
                    </h3>
                    {roundSubs === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg font-medium mb-1">
                          No responses yet
                        </p>
                        <p className="text-sm">
                          Waiting for students to complete this round...
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.3 0.03 280)"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "oklch(0.65 0.02 280)", fontSize: 13 }}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: "oklch(0.65 0.02 280)", fontSize: 13 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.2 0.025 280)",
                              border: "1px solid oklch(0.3 0.03 280)",
                              borderRadius: "12px",
                              color: "oklch(0.95 0.01 280)",
                            }}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
                            {chartData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
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
          <div className="lq-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">🏆 Final Leaderboard</h2>
              <Badge variant="outline" className="text-sm">
                {filteredSubmissions.length} Players
              </Badge>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-1">No submissions yet</p>
                <p className="text-sm">
                  Waiting for students to complete the game...
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="w-16 text-center font-semibold">
                        Rank
                      </TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Group</TableHead>
                      <TableHead className="text-right font-semibold">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub, index) => (
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
                        <TableCell className="font-medium">
                          {sub.playerName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {sub.groupName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold font-mono ${
                              index < 3 ? "text-emerald" : ""
                            }`}
                          >
                            {sub.totalScore}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
