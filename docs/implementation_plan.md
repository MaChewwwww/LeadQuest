# 🏗️ Technical Documentation: LeadQuest Simulator

## 1. Project Overview & Tech Stack
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS + Shadcn UI (for modern, bento-box style components)
*   **Charts:** Recharts (for the Admin Dashboard visualizer)
*   **State Management:** Zustand (with `persist` middleware for `localStorage`)
*   **Database:** Supabase (PostgreSQL)
*   **ORM:** Drizzle ORM
*   **Deployment:** Vercel

### Architecture Strategy
1. **Client-Side Gameplay:** The user's session (Name, Group, Start Time, and Answers) is stored in the browser's `localStorage` via Zustand to survive refreshes.
2. **Single-Write Database:** Only **one** database transaction occurs per user at the end of the game to prevent race conditions.
3. **Presenter Dashboard:** A secured `/admin` route allows the presenter to see real-time submission counts, reveal choice statistics (Bar Charts), and display the final Leaderboard.

---

## 2. Environment Variables (`.env.local`)
The application requires the following environment variables. The `ADMIN_PASSKEY` is used to secure the presenter's dashboard.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
ADMIN_PASSKEY=your_secret_passkey_for_presentation
```

---

## 3. Database Schema (Drizzle ORM)
A single table stores the final results. Storing the answers as `jsonb` allows the Admin Dashboard to easily aggregate how many people picked Option A, B, C, or D.

**`src/db/schema.ts`**
```typescript
import { pgTable, serial, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  playerName: varchar('player_name', { length: 100 }).notNull(),
  groupName: varchar('group_name', { length: 50 }).notNull(),
  
  // Total calculated score for the final leaderboard
  totalScore: integer('total_score').notNull().default(0),
  
  // JSON object storing choices: { "1": "C", "2": "B", "3": "A" ... }
  answers: jsonb('answers').notNull(),
  
  // JSON object storing points earned per round: { "1": 100, "2": -50 ... }
  roundScores: jsonb('round_scores').notNull(),
  
  completed: boolean('completed').default(true),
  submittedAt: timestamp('submitted_at').defaultNow(),
});
```

---

## 4. Application Routing & Component Flow

### Route 1: `/` (The Onboarding Page)
*   Checks `useGameStore`. If `gameStartTime` exists and `isSubmitted` is false, automatically redirect to `/play`.
*   Contains a Shadcn UI form for `playerName` and `groupName`.
*   On submit -> updates Zustand store -> `router.push('/play')`.

### Route 2: `/play` (The Main Game Arena)
*   Displays the 15-minute global timer (calculated based on `gameStartTime`).
*   Auto-Submits to `/api/submit` if `currentRound > 6` OR `timeLeft === 0`.
*   Zero database reads/writes occur during gameplay until the final submission.

### Route 3: `/admin` (The Presenter's Dashboard)
This is the core presentation tool. It features two states: Locked and Unlocked.

**State 1: Locked (Authentication)**
*   Displays a password input field.
*   Calls an API route (e.g., `/api/admin/verify`) that checks the input against `process.env.ADMIN_PASSKEY`. 
*   If successful, sets an HTTP-only cookie or a local session state to unlock the dashboard.

**State 2: Unlocked (The Dashboard Interface)**
*   **Data Fetching:** Polls the database every 5 seconds (or via a manual refresh button) to get all rows from the `submissions` table.
*   **Sidebar/Tabs:** Allows the presenter to navigate between "Round 1" through "Round 6", and "Leaderboard".
*   **The "Suspense" Toggle (Per Round):**
    *   Toggle State = `Hide Charts` (Default). The UI only displays: *"Total Submissions: 34"*. This builds suspense while the class is playing.
    *   Toggle State = `Reveal Results`. The UI renders a **Recharts Bar Chart** showing the distribution of choices (e.g., Option A: 5, Option B: 20, Option C: 9).
*   **Leaderboard Tab:** Displays a Shadcn Data Table sorting all users by `totalScore` descending. Shows Name, Group, and Total Score.

---

## 5. Global State Management (Zustand)

**`src/store/useGameStore.ts`**
```typescript
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
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerName: '',
      groupName: '',
      currentRound: 1,
      gameStartTime: null,
      answers: {},
      roundScores: {},
      isSubmitted: false,

      startGame: (name, group) => set({ 
        playerName: name, groupName: group, currentRound: 1, gameStartTime: Date.now() 
      }),

      submitAnswer: (round, answer, score) => set((state) => ({
        answers: { ...state.answers, [round]: answer },
        roundScores: { ...state.roundScores, [round]: score },
        currentRound: state.currentRound + 1
      })),

      setSubmitted: () => set({ isSubmitted: true }),
    }),
    { name: 'leadquest-session' }
  )
);
```

---

## 6. The API Routes

**1. `src/app/api/submit/route.ts` (Saves Player Data)**
*   Receives payload. Calculates `totalScore` securely on the backend by summing the `roundScores` JSON object.
*   Inserts row into the `submissions` table using Drizzle.

**2. `src/app/api/admin/verify/route.ts` (Secures the Dashboard)**
*   Receives `{ passkey }` from the client.
*   Checks `if (passkey === process.env.ADMIN_PASSKEY)`.
*   Returns success status so the frontend can unlock the dashboard state.

---

## 7. AntiGravity AI Prompt

*Copy and paste the prompt below into AntiGravity to begin scaffolding.*

> "I am building a Next.js 15 App Router application called LeadQuest. It is an educational web-game for a live classroom presentation. Please read the provided Technical Documentation in this workspace. 
>
> 1. Start by initializing the Next.js project, and install Tailwind CSS, Shadcn UI, Zustand, Drizzle ORM, Supabase JS client, and Recharts.
> 2. Create the Drizzle schema exactly as defined in the docs.
> 3. Implement the Zustand store with `persist` middleware.
> 4. Build the three main routes: `/` (onboarding), `/play` (gameplay and timer hook), and `/admin` (the presenter dashboard).
> 5. For the `/admin` route, implement the passkey authentication flow checking against `process.env.ADMIN_PASSKEY`. Then build the dashboard featuring tabs for Rounds 1-6, the 'Reveal Results' toggle that shows a Recharts bar chart, and the Leaderboard data table.
>
> Please begin by setting up the database schema and the Zustand store."
````</GameState>