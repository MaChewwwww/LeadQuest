import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, groupName, answers, roundScores, timeTakenSeconds } = body;

    if (!playerName || !groupName || !answers || !roundScores) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate totalScore securely on the backend
    const totalScore = Object.values(roundScores as Record<string, number>).reduce(
      (sum, score) => sum + score,
      0
    );

    await db.insert(submissions).values({
      playerName,
      groupName,
      totalScore,
      answers,
      roundScores,
      timeTakenSeconds: timeTakenSeconds || 0,
      completed: true,
    });

    return NextResponse.json({ success: true, totalScore });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit results' },
      { status: 500 }
    );
  }
}
