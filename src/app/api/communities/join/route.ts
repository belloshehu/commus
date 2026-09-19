import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/lib/auth';
import { joinCommunity } from '@/lib/firebase/rtdb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, communityId, inviteCode } = body;

    const userSession: UserSession = session || { role: 'ANONYMOUS', isAuthenticated: false };

    if (!userSession.isAuthenticated || userSession.role === 'ANONYMOUS') {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Anonymous visitors must log in to join community safety zones.',
        },
        { status: 401 }
      );
    }

    if (!communityId && !inviteCode) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Community ID or Invite Code is required to join.',
        },
        { status: 400 }
      );
    }

    const result = await joinCommunity(userSession, communityId || '', inviteCode);

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
