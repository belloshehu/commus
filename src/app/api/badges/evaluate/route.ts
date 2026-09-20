import { NextRequest, NextResponse } from 'next/server';
import { BadgeService } from '@/lib/badges/service';
import { authenticateServerSession } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);

    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required for badge evaluation.' }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, mockVerifiedEvents } = body;

    const userId = targetUserId || session.userId;
    if (!userId) {
      return NextResponse.json({ error: 'INVALID_REQUEST', message: 'User ID is required.' }, { status: 400 });
    }

    if (userId !== session.userId && session.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Cannot trigger badge evaluation for another user.' }, { status: 403 });
    }

    // Strictly reject client-injected fake events unless caller is SYSTEM_ADMIN
    let verifiedEvents = [];
    if (mockVerifiedEvents && Array.isArray(mockVerifiedEvents) && mockVerifiedEvents.length > 0) {
      if (session.role === 'SYSTEM_ADMIN') {
        verifiedEvents = mockVerifiedEvents;
      } else {
        return NextResponse.json(
          { error: 'SECURITY_VIOLATION', message: 'Client self-granting of verified events is prohibited.' },
          { status: 403 }
        );
      }
    }

    const badgeService = BadgeService.getInstance();
    const evaluation = await badgeService.evaluateUserBadges(session, userId, verifiedEvents);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to evaluate badge eligibility.' },
      { status: 400 }
    );
  }
}
