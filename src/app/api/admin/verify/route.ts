import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey } = body;

    if (!passkey) {
      return NextResponse.json(
        { error: 'Passkey is required' },
        { status: 400 }
      );
    }

    const isValid = passkey === process.env.ADMIN_PASSKEY;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid passkey' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
