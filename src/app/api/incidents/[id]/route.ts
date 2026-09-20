import { NextRequest, NextResponse } from 'next/server';
import { getIncidentById } from '@/lib/firebase/rtdb';
import { authenticateServerSession } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const incidentId = resolvedParams.id;

    // Secure server session authentication (rejects query param forgery like ?role=SYSTEM_ADMIN)
    const session = authenticateServerSession(req);

    // Fetch from RTDB helper which enforces community isolation and location privacy
    const incident = await getIncidentById(session, incidentId);

    if (!incident) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Incident report not found or isolated by community rules.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      incident: {
        ...incident,
        reporterLabel: 'Reported by a verified community member',
      },
    });
  } catch (error: any) {
    const isAuthError = error.message && error.message.startsWith('UNAUTHORIZED');
    if (isAuthError) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Access Denied: You are not authorized to view safety incidents from this community zone.',
        },
        { status: 403 }
      );
    }

    console.error('[API /api/incidents/[id]] Fetch error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error.message || 'Error retrieving incident details.' },
      { status: 500 }
    );
  }
}
