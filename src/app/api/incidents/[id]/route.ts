import { NextRequest, NextResponse } from 'next/server';
import { canViewPrivateCommunityIncidents, UserSession } from '@/lib/auth';
import { getIncidentById } from '@/lib/firebase/rtdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const incidentId = resolvedParams.id;

    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'ANONYMOUS') as any;
    const userCommunityId = searchParams.get('communityId') || undefined;
    const isAuthenticated = searchParams.get('isAuthenticated') === 'true';

    const session: UserSession = {
      role,
      communityId: userCommunityId,
      isAuthenticated,
    };

    // Attempt fetch from RTDB helper which enforces authorization
    const incident = await getIncidentById(session, incidentId);

    if (!incident) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Incident report not found.' },
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
    if (error.message && error.message.startsWith('UNAUTHORIZED')) {
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
