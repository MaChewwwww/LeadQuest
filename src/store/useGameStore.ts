import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  playerName: string;
  groupName: string;
  currentRound: number;
  gameStartTime: number | null;
  answers: Record<string, string>;
  roundScores: Record<string, number>;
  isSubmitted: boolean;
  
  startGame: (name: string, group: string) => void;
  submitAnswer: (round: number, answer: string, score: number) => void;
  setSubmitted: () => void;
  resetGame: () => void;
}

const initialState = {
  playerName: '',
  groupName: '',
  currentRound: 1,
  gameStartTime: null as number | null,
  answers: {} as Record<string, string>,
  roundScores: {} as Record<string, number>,
  isSubmitted: false,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,

      startGame: (name, group) => set({ 
        playerName: name, 
        groupName: group, 
        currentRound: 1, 
        gameStartTime: Date.now(),
        answers: {},
        roundScores: {},
        isSubmitted: false,
      }),

      submitAnswer: (round, answer, score) => set((state) => ({
        answers: { ...state.answers, [round]: answer },
        roundScores: { ...state.roundScores, [round]: score },
        currentRound: state.currentRound + 1,
      })),

      setSubmitted: () => set({ isSubmitted: true }),

      resetGame: () => set(initialState),
    }),
    { name: 'leadquest-session' }
  )
);
