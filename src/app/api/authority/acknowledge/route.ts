import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/lib/auth';
import { AuthorityNotificationService } from '@/lib/authority/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, incidentId } = body;

    const userSession: UserSession = session || { role: 'ANONYMOUS', isAuthenticated: false };

    if (!userSession.isAuthenticated) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required for dispatcher acknowledgment.' },
        { status: 401 }
      );
    }

    if (!incidentId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Incident ID is required for acknowledgment.' },
        { status: 400 }
      );
    }

    const service = AuthorityNotificationService.getInstance();
    const record = await service.acknowledgeEscalation(userSession, incidentId);

    return NextResponse.json({
      success: true,
      escalation: record,
      message: `Escalation #${incidentId} acknowledged by authority dispatcher.`,
    });
  } catch (error: any) {
    console.error('[API /api/authority/acknowledge] Error:', error);
    const status = error.message && error.message.startsWith('UNAUTHORIZED') ? 403 : 500;

    return NextResponse.json(
      {
        error: error.message?.startsWith('UNAUTHORIZED') ? 'UNAUTHORIZED' : 'SERVER_ERROR',
        message: error.message || 'Authority acknowledgment failed.',
      },
      { status }
    );
  }
}
