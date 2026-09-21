import { UserSession, UserRole } from './auth';

export type CanonicalRole =
  | 'user'
  | 'community_manager'
  | 'authority'
  | 'admin'
  | 'super_admin';

export function normalizeRole(role: UserRole | CanonicalRole | string | undefined | null): CanonicalRole {
  if (!role) return 'user';
  const lower = String(role).toLowerCase().trim();

  if (lower === 'super_admin' || lower === 'superadmin') return 'super_admin';
  if (lower === 'admin' || lower === 'system_admin') return 'admin';
  if (lower === 'authority' || lower === 'authority_dispatcher') return 'authority';
  if (lower === 'community_manager' || lower === 'verified_community_leader') return 'community_manager';
  return 'user';
}

export function toLegacyRole(role: CanonicalRole | string): UserRole {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'super_admin':
    case 'admin':
      return 'SYSTEM_ADMIN';
    case 'authority':
      return 'AUTHORITY_DISPATCHER';
    case 'community_manager':
      return 'VERIFIED_COMMUNITY_LEADER';
    case 'user':
    default:
      return 'CITIZEN_MEMBER';
  }
}

export type PermissionAction =
  | 'incident:create'
  | 'incident:view'
  | 'incident:update'
  | 'incident:delete'
  | 'incident:decrypt_location'
  | 'community:manage'
  | 'community:view_private'
  | 'community:moderate_members'
  | 'user:manage'
  | 'user:suspend'
  | 'role:assign'
  | 'role:revoke'
  | 'evidence:upload'
  | 'evidence:view'
  | 'authority:dispatch'
  | 'authority:manage'
  | 'campaign:create'
  | 'campaign:manage'
  | 'guidance:create'
  | 'guidance:manage'
  | 'super_admin:operate';

export interface ResourceContext {
  communityId?: string;
  reporterUid?: string;
  assignedAuthorityId?: string;
  incidentId?: string;
  targetRole?: CanonicalRole | UserRole;
  targetUserId?: string;
  isSelf?: boolean;
}

/**
 * CENTRALIZED PERMISSION ENGINE
 * Evaluates Effective Permission using:
 * Global Role + Community Membership/Scoping + Authority Scope + Ownership + Resource State
 */
export function can(
  session: UserSession | null | undefined,
  action: PermissionAction,
  resource?: ResourceContext
): boolean {
  if (!session || !session.isAuthenticated) {
    return false;
  }

  const role = normalizeRole(session.role);

  // SUPER_ADMIN has platform-wide authorization, audited
  if (role === 'super_admin') {
    return true;
  }

  switch (action) {
    // --- INCIDENTS ---
    case 'incident:create':
      if (session.role === 'ANONYMOUS' || session.role === 'anonymous') return false;
      return true; // All authenticated non-anonymous users can report incidents


    case 'incident:view': {
      if (role === 'admin') return true;
      if (!resource || !resource.communityId) return true; // Public feed

      if (role === 'authority') {
        // Authority can view assigned community or assigned incident
        if (!resource.assignedAuthorityId || resource.assignedAuthorityId === session.userId) return true;
      }

      if (role === 'community_manager') {
        // Community manager scoped check
        if (session.communityId === resource.communityId) return true;
      }

      // User check
      if (resource.reporterUid && resource.reporterUid === session.userId) return true;
      return session.communityId === resource.communityId;
    }

    case 'incident:update': {
      if (role === 'admin') return true;
      if (resource?.reporterUid && resource.reporterUid === session.userId) return true;
      if (role === 'community_manager' && resource?.communityId === session.communityId) return true;
      if (role === 'authority') return true;
      return false;
    }

    case 'incident:delete': {
      return role === 'admin';
    }

    case 'incident:decrypt_location': {
      return role === 'authority' || role === 'admin';
    }

    // --- COMMUNITIES ---
    case 'community:view_private': {
      if (role === 'admin' || role === 'authority') return true;
      return Boolean(resource?.communityId && session.communityId === resource.communityId);
    }

    case 'community:manage':
    case 'community:moderate_members': {
      if (role === 'admin') return true;
      if (role === 'community_manager') {
        // Must be scoped to the managed community
        return Boolean(resource?.communityId && session.communityId === resource.communityId);
      }
      return false;
    }

    // --- USERS & ROLES ---
    case 'user:manage':
    case 'user:suspend': {
      return role === 'admin';
    }

    case 'role:assign':
    case 'role:revoke': {
      const targetRole = normalizeRole(resource?.targetRole);
      if (targetRole === 'super_admin' || targetRole === 'admin') {
        // Only super_admin can assign/revoke super_admin or admin roles.
        // Early return at start of function ensures super_admin returns true.
        return false;
      }
      if (role === 'admin') return true;
      if (role === 'community_manager' && targetRole === 'user') return true;
      return false;
    }

    // --- EVIDENCE ---
    case 'evidence:upload':
      return true;

    case 'evidence:view': {
      if (role === 'admin' || role === 'authority') return true;
      if (resource?.communityId) {
        return session.communityId === resource.communityId;
      }
      return true;
    }

    // --- AUTHORITIES ---
    case 'authority:dispatch':
      return role === 'authority' || role === 'admin';

    case 'authority:manage':
      return role === 'admin';

    // --- CAMPAIGNS ---
    case 'campaign:create':
    case 'campaign:manage': {
      if (role === 'admin') return true;
      if (role === 'community_manager') {
        if (!resource?.communityId) return true;
        return session.communityId === resource.communityId;
      }
      return false;
    }

    // --- SAFETY GUIDANCE ---
    case 'guidance:create':
    case 'guidance:manage': {
      return role === 'authority' || role === 'admin';
    }

    case 'super_admin:operate':
      return false; // Handled by early super_admin return above

    default:
      return false;
  }
}

