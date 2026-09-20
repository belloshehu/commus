import { NextRequest, NextResponse } from 'next/server';
import { recordVote, VoteType } from '@/lib/firebase/rtdb';
import { authenticateServerSession, checkRateLimit } from '@/lib/security';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = authenticateServerSession(req);
    const { id: incidentId } = await params;

    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'You must be logged in as a verified member to vote on incident authenticity.',
        },
        { status: 401 }
      );
    }

    // Rate limiting: max 15 vote requests per minute per user/IP
    const ip = req.headers.get('x-forwarded-for') || session.userId;
    const rateCheck = checkRateLimit(`vote_${ip}`, { windowMs: 60000, maxRequests: 15 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'You are voting too quickly. Please wait a moment before voting again.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { voteType } = body;

    if (!voteType || !['UP', 'DOWN'].includes(voteType)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Invalid voteType. Allowed values are "UP" or "DOWN".',
        },
        { status: 400 }
      );
    }

    const result = await recordVote(session, incidentId, voteType as VoteType);

    return NextResponse.json({
      success: true,
      incidentId,
      upvotes: result.upvotes,
      downvotes: result.downvotes,
      authenticityStatus: result.authenticityStatus,
      userVote: result.userVote,
    });
  } catch (error: any) {
    console.error('[API /incidents/[id]/vote] Error:', error);
    const status = error.message?.includes('UNAUTHORIZED') ? 403 : error.message?.includes('NOT_FOUND') ? 404 : 500;
    return NextResponse.json(
      {
        error: status === 403 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
        message: error.message || 'Failed to record vote.',
      },
      { status }
    );
  }
}
