# LeadQuest

LeadQuest is an educational web-game and leadership simulation built for live classroom presentations. It features a 6-round interactive scenario where students vote on leadership decisions, and a real-time presenter dashboard for analyzing class responses and revealing a final leaderboard.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Zustand (with local storage persistence)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Charts**: Recharts

## 🎮 Features

1. **Onboarding (`/`)**: A seamless entry point for students to input their name and group.
2. **Gameplay (`/play`)**: A 15-minute timed simulation guiding students through 6 leadership scenarios. Progress is saved locally to survive accidental page refreshes.
3. **Presenter Dashboard (`/admin`)**: A secure dashboard gated by a passkey. Features real-time polling to view submission counts, visual bar charts for choice distributions, and an automated final leaderboard.

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root of the project and add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Database Connection (Drizzle ORM)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-REGION.pooler.supabase.com:6543/postgres"

# Presenter Dashboard Passkey
ADMIN_PASSKEY=LeadQuest123!!!
```
*(Make sure to URL-encode your database password if it contains special characters).*

### 3. Initialize the Database
Run the reset script to connect to your Supabase PostgreSQL instance, drop any existing tables, and build the `submissions` schema from scratch:
```bash
npm run db:reset
```

### 4. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
- **[http://localhost:3000](http://localhost:3000)** to play the game as a student.
- **[http://localhost:3000/admin](http://localhost:3000/admin)** to open the presenter dashboard.

## 📝 Customizing the Curriculum
To update the 6 leadership scenarios, edit the `questions` array inside:
`src/data/questions.ts`

Each option is assigned a point value which ultimately decides the student's final leaderboard ranking.
