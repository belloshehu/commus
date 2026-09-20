import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/service';
import { authenticateServerSession, sanitizeHtmlText } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);
    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required to view notifications.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || session.userId;

    // Privacy Isolation: Users can ONLY fetch their own notifications unless SYSTEM_ADMIN
    if (targetUserId !== session.userId && session.role !== 'SYSTEM_ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Access Denied: You cannot view notifications belonging to another user.' }, { status: 403 });
    }

    const notificationService = NotificationService.getInstance();
    const notifications = await notificationService.getUserNotifications(session, targetUserId);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unauthorized access to notifications.' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, [
      'VERIFIED_COMMUNITY_LEADER',
      'AUTHORITY_DISPATCHER',
      'SYSTEM_ADMIN',
    ]);

    const body = await req.json();
    const { recipientUserId, eventType, title, message, riskLevel, referenceId, communityId, actionUrl } = body;

    if (!recipientUserId || !eventType || !title || !message) {
      return NextResponse.json({ error: 'Missing required notification dispatch fields.' }, { status: 400 });
    }

    const safeTitle = sanitizeHtmlText(title);
    const safeMsg = sanitizeHtmlText(message);

    const notificationService = NotificationService.getInstance();
    const result = await notificationService.dispatchEventNotification({
      recipientUserId,
      eventType,
      title: safeTitle,
      message: safeMsg,
      riskLevel,
      referenceId: referenceId || `ref_${Date.now()}`,
      communityId,
      actionUrl,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message || 'Failed to dispatch notification.' },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = authenticateServerSession(req);
    if (!session.isAuthenticated || !session.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId } = body;

    const notificationService = NotificationService.getInstance();

    if (action === 'MARK_ALL_READ') {
      await notificationService.markAllAsRead(session);
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (action === 'MARK_READ' && notificationId) {
      await notificationService.markAsRead(session, notificationId);
      return NextResponse.json({ success: true, message: `Notification ${notificationId} marked as read.` });
    }

    return NextResponse.json({ error: 'Invalid PATCH action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update notification status.' }, { status: 500 });
  }
}
