/**
 * Database Reset Script
 * 
 * Drops all data from the submissions table and re-applies the schema.
 * Usage: npx tsx scripts/reset-db.ts
 */
import { config } from 'dotenv';
// Load .env first, then override with .env.local
config({ path: '.env' });
config({ path: '.env.local', override: true });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString === 'your_postgresql_connection_string') {
    console.error('❌ DATABASE_URL is not configured. Set it in .env.local first.');
    console.log('\n📖 Get your connection string from:');
    console.log('   Supabase Dashboard → Settings → Database → Connection string (URI)');
    process.exit(1);
  }

  console.log('🔄 Connecting to Supabase...');
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    // Drop the table if it exists
    console.log('🗑️  Dropping existing submissions table...');
    await db.execute(sql`DROP TABLE IF EXISTS submissions CASCADE`);

    // Recreate the table
    console.log('📋 Creating submissions table...');
    await db.execute(sql`
      CREATE TABLE submissions (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(100) NOT NULL,
        group_name VARCHAR(50) NOT NULL,
        total_score INTEGER NOT NULL DEFAULT 0,
        answers JSONB NOT NULL,
        round_scores JSONB NOT NULL,
        completed BOOLEAN DEFAULT TRUE,
        submitted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database reset complete!');
    console.log('   Table "submissions" has been recreated with a clean schema.');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
