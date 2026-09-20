import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/adminService';
import { authenticateServerSession, sanitizeHtmlText } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['SYSTEM_ADMIN']);
    const adminService = AdminService.getInstance();
    const communities = await adminService.getCommunities(session);
    return NextResponse.json({ success: true, communities });
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
    const { name, region, description } = body;

    const safeName = sanitizeHtmlText(name);
    const safeRegion = sanitizeHtmlText(region);
    const safeDesc = sanitizeHtmlText(description);

    const community = await adminService.createCommunity(session, {
      name: safeName,
      region: safeRegion,
      description: safeDesc,
    });
    return NextResponse.json({ success: true, community });
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
    const { action, communityId, status, memberId, memberAction } = body;

    if (action === 'update_status') {
      const community = await adminService.updateCommunityStatus(session, communityId, status);
      return NextResponse.json({ success: true, community });
    }

    if (action === 'moderate_member') {
      const community = await adminService.moderateCommunityMember(session, communityId, memberId, memberAction);
      return NextResponse.json({ success: true, community });
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
