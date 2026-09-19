import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/lib/auth';
import { AuthorityNotificationService } from '@/lib/authority/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, incidentId, reason } = body;

    const userSession: UserSession = session || { role: 'ANONYMOUS', isAuthenticated: false };

    if (!userSession.isAuthenticated) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required for emergency authority escalations.' },
        { status: 401 }
      );
    }

    if (!incidentId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Incident ID is required for authority escalation.' },
        { status: 400 }
      );
    }

    const service = AuthorityNotificationService.getInstance();
    const escalationRecord = await service.escalateIncidentToAuthority(userSession, incidentId, reason);

    return NextResponse.json({
      success: true,
      escalation: escalationRecord,
      message: `Incident escalated to ${escalationRecord.authorityTarget}. Delivery status: ${escalationRecord.status}.`,
    });
  } catch (error: any) {
    console.error('[API /api/authority/escalate] Error:', error);
    const status = error.message && error.message.startsWith('UNAUTHORIZED') ? 403 : 500;

    return NextResponse.json(
      {
        error: error.message?.startsWith('UNAUTHORIZED') ? 'UNAUTHORIZED' : 'SERVER_ERROR',
        message: error.message || 'Authority escalation failed.',
      },
      { status }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get('incidentId');
    const role = (searchParams.get('role') || 'ANONYMOUS') as any;
    const isAuthenticated = searchParams.get('isAuthenticated') === 'true';
    const userId = searchParams.get('userId') || undefined;

    const session: UserSession = { role, isAuthenticated, userId };

    if (!incidentId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Incident ID search parameter is required.' },
        { status: 400 }
      );
    }

    const service = AuthorityNotificationService.getInstance();
    const record = await service.getEscalationStatus(session, incidentId);

    return NextResponse.json({
      success: true,
      escalation: record,
    });
  } catch (error: any) {
    const status = error.message && error.message.startsWith('UNAUTHORIZED') ? 403 : 500;
    return NextResponse.json(
      {
        error: error.message?.startsWith('UNAUTHORIZED') ? 'UNAUTHORIZED' : 'SERVER_ERROR',
        message: error.message || 'Error fetching authority escalation status.',
      },
      { status }
    );
  }
}
