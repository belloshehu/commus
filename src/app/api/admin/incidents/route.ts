import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/adminService';
import { authenticateServerSession, sanitizeHtmlText } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const adminService = AdminService.getInstance();
    const incidents = await adminService.getIncidents(session);
    return NextResponse.json({ success: true, incidents });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const adminService = AdminService.getInstance();

    const body = await req.json();
    const { action, incidentId, moderationStatus, notes, reportId, abuseAction } = body;

    if (action === 'update_moderation') {
      const safeNotes = sanitizeHtmlText(notes);
      const incident = await adminService.updateIncidentModerationStatus(session, incidentId, moderationStatus, safeNotes);
      return NextResponse.json({ success: true, incident });
    }

    if (action === 'investigate_abuse') {
      await adminService.investigateAbuseReport(session, reportId, abuseAction);
      return NextResponse.json({ success: true, message: 'Abuse report action logged successfully.' });
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
