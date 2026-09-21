import { NextRequest, NextResponse } from 'next/server';
import { authenticateServerSession } from '@/lib/security';
import { can, normalizeRole, CanonicalRole } from '@/lib/authorization';
import { AdminService } from '@/lib/adminService';

export async function POST(req: NextRequest) {
  try {
    const session = authenticateServerSession(req, ['admin', 'super_admin']);

    const body = await req.json();
    const { action, targetUserId, targetRole, communityId, authorityOrganizationId, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Missing targetUserId' }, { status: 400 });
    }

    const adminService = AdminService.getInstance();
    const requestedCanonicalRole: CanonicalRole = normalizeRole(targetRole);

    // 1. Check Privilege Escalation Protection
    if (!can(session, 'role:assign', { targetRole: requestedCanonicalRole, targetUserId })) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: `Your role (${session.role}) does not have permission to assign role "${requestedCanonicalRole}". Only super_admin can create admin or super_admin roles.`,
        },
        { status: 403 }
      );
    }

    if (action === 'assignRole') {
      const updatedUser = await adminService.updateUserRole(
        session,
        targetUserId,
        requestedCanonicalRole as any,
        reason || 'Role assigned by administrator'
      );
      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === 'revokeRole') {
      // Check Super Admin demotion protection
      if (requestedCanonicalRole === 'super_admin' || targetRole === 'super_admin') {
        const users = await adminService.getUsers(session);
        const activeSuperAdmins = users.filter((u) => normalizeRole(u.role) === 'super_admin');
        if (activeSuperAdmins.length <= 1 && activeSuperAdmins.some((u) => u.userId === targetUserId)) {
          return NextResponse.json(
            {
              error: 'PROTECTION_VIOLATION',
              message: 'Cannot revoke or demote the final active super_admin user.',
            },
            { status: 400 }
          );
        }
      }

      const updatedUser = await adminService.updateUserRole(
        session,
        targetUserId,
        'user' as any,
        reason || 'Role revoked by administrator'
      );
      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === 'assignCommunityManager') {
      if (!communityId) {
        return NextResponse.json({ error: 'BAD_REQUEST', message: 'Missing communityId for community manager scoping' }, { status: 400 });
      }

      const updatedUser = await adminService.assignCommunityManagerScope(
        session,
        targetUserId,
        communityId,
        reason || 'Assigned Community Manager role'
      );
      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === 'assignAuthority') {
      const updatedUser = await adminService.assignAuthorityScope(
        session,
        targetUserId,
        authorityOrganizationId || 'EMERGENCY_DISPATCH_UNIT',
        reason || 'Assigned Authority Dispatcher role'
      );
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid action parameter' }, { status: 400 });
  } catch (err: any) {
    const isAuthError = err.message?.includes('UNAUTHORIZED') || err.message?.includes('FORBIDDEN');
    return NextResponse.json(
      { error: isAuthError ? 'UNAUTHORIZED' : 'SERVER_ERROR', message: err.message },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
