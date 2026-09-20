import { NextRequest, NextResponse } from 'next/server';
import { joinCommunity } from '@/lib/firebase/rtdb';
import { authenticateServerSession } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);

    if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Anonymous visitors must log in to join community safety zones.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { communityId, inviteCode } = body;

    if (!communityId && !inviteCode) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Community ID or Invite Code is required to join.',
        },
        { status: 400 }
      );
    }

    const result = await joinCommunity(session, communityId || '', inviteCode);

    return NextResponse.json({
      success: true,
      communityName: result.communityName,
      message: `Successfully joined safety community "${result.communityName}".`,
    });
  } catch (error: any) {
    console.error('[API /api/communities/join] Join error:', error);

    const status = error.message && error.message.includes('INVALID_INVITE_CODE') ? 403 : 500;

    return NextResponse.json(
      {
        error: error.message?.startsWith('INVALID_INVITE_CODE') ? 'INVALID_INVITE_CODE' : 'SERVER_ERROR',
        message: error.message || 'Failed to join community.',
      },
      { status }
    );
  }
}
