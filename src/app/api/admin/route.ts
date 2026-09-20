import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/adminService';
import { authenticateServerSession, checkRateLimit } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);

    const ip = req.headers.get('x-forwarded-for') || session.userId || 'admin_client';
    const rateCheck = checkRateLimit(ip, { windowMs: 60000, maxRequests: 60 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'analytics';
    const adminService = AdminService.getInstance();

    if (action === 'analytics') {
      const analytics = await adminService.getAggregateAnalytics(session);
      return NextResponse.json({ success: true, analytics });
    }

    if (action === 'users') {
      const users = await adminService.getUsers(session);
      return NextResponse.json({ success: true, users });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);

    const body = await req.json();
    const { action, targetUserId, newRole, suspended, reason } = body;
    const adminService = AdminService.getInstance();

    if (action === 'update_role') {
      const user = await adminService.updateUserRole(session, targetUserId, newRole);
      return NextResponse.json({ success: true, user });
    }

    if (action === 'set_suspended') {
      const user = await adminService.setUserSuspended(session, targetUserId, Boolean(suspended), reason);
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
