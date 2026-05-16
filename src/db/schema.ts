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
