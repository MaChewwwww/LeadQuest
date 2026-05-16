import { useState, useEffect, useCallback } from 'react';

const GAME_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

interface TimerReturn {
  minutes: number;
  seconds: number;
  totalSecondsLeft: number;
  isExpired: boolean;
  progress: number; // 0 to 1 representing how much time has passed
}

export function useTimer(gameStartTime: number | null): TimerReturn {
  const calculateTimeLeft = useCallback(() => {
    if (!gameStartTime) {
      return { minutes: 15, seconds: 0, totalSecondsLeft: 900, isExpired: false, progress: 0 };
    }

    const elapsed = Date.now() - gameStartTime;
    const remainingMs = Math.max(0, GAME_DURATION_MS - elapsed);
    const totalSecondsLeft = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSecondsLeft / 60);
    const seconds = totalSecondsLeft % 60;
    const isExpired = remainingMs <= 0;
    const progress = Math.min(1, elapsed / GAME_DURATION_MS);

    return { minutes, seconds, totalSecondsLeft, isExpired, progress };
  }, [gameStartTime]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    if (!gameStartTime) return;

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (newTime.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStartTime, calculateTimeLeft]);

  return timeLeft;
}
