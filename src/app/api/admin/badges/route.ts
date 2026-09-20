import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/adminService';
import { authenticateServerSession, sanitizeHtmlText } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'definitions';
    const adminService = AdminService.getInstance();

    if (type === 'awards') {
      const awards = await adminService.getBadgeAwards(session);
      return NextResponse.json({ success: true, awards });
    }

    const definitions = await adminService.getBadgeDefinitions(session);
    return NextResponse.json({ success: true, definitions });
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
    const adminService = AdminService.getInstance();

    const body = await req.json();
    const { action, targetUserId, awardId, reason } = body;

    if (action === 'revoke') {
      const safeReason = sanitizeHtmlText(reason);
      const log = await adminService.revokeBadgeAward(session, targetUserId, awardId, safeReason);
      return NextResponse.json({ success: true, auditLog: log });
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
