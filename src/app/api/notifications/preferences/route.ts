import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/service';
import { authenticateServerSession } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);
    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || session.userId;

    // Privacy isolation
    if (targetUserId !== session.userId && session.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Cannot access notification preferences for another user.' }, { status: 403 });
    }

    const notificationService = NotificationService.getInstance();
    const preferences = await notificationService.getUserPreferences(targetUserId);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch preferences.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);
    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { preferences } = body;

    const notificationService = NotificationService.getInstance();
    const updated = await notificationService.updateUserPreferences(session, {
      ...preferences,
      userId: session.userId, // Force session userId
    });

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update preferences.' }, { status: 400 });
  }
}
