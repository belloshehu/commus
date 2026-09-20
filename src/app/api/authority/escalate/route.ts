import { NextRequest, NextResponse } from 'next/server';
import { AuthorityNotificationService } from '@/lib/authority/service';
import { authenticateServerSession, checkRateLimit, sanitizeHtmlText } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, [
      'VERIFIED_COMMUNITY_LEADER',
      'AUTHORITY_DISPATCHER',
      'SYSTEM_ADMIN',
    ]);

    const ip = req.headers.get('x-forwarded-for') || session.userId || 'escalation_client';
    const rateCheck = checkRateLimit(ip, { windowMs: 60000, maxRequests: 5 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many escalation requests' }, { status: 429 });
    }

    const body = await req.json();
    const { incidentId, reason } = body;

    if (!incidentId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Incident ID is required for authority escalation.' },
        { status: 400 }
      );
    }

    const safeReason = sanitizeHtmlText(reason);
    const service = AuthorityNotificationService.getInstance();
    const escalationRecord = await service.escalateIncidentToAuthority(session, incidentId, safeReason);

    return NextResponse.json({
      success: true,
      escalation: escalationRecord,
      message: `Incident escalated to ${escalationRecord.authorityTarget}. Delivery status: ${escalationRecord.status}.`,
    });
  } catch (error: any) {
    console.error('[API /api/authority/escalate] Error:', error);
    const isAuthError = error.message?.includes('UNAUTHORIZED');

    return NextResponse.json(
      {
        error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR',
        message: error.message || 'Authority escalation failed.',
      },
      { status: isAuthError ? 403 : 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, [
      'VERIFIED_COMMUNITY_LEADER',
      'AUTHORITY_DISPATCHER',
      'SYSTEM_ADMIN',
    ]);

    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get('incidentId');

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
    const isAuthError = error.message?.includes('UNAUTHORIZED');
    return NextResponse.json(
      {
        error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR',
        message: error.message || 'Error fetching authority escalation status.',
      },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
