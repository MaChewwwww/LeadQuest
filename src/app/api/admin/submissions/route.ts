import { NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allSubmissions = await db
      .select()
      .from(submissions)
      .orderBy(desc(submissions.totalScore));

    return NextResponse.json({ submissions: allSubmissions });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
