import { can, normalizeRole, CanonicalRole } from './authorization';

export type LegacyUserRole =
  | 'ANONYMOUS'
  | 'CITIZEN_MEMBER'
  | 'VERIFIED_COMMUNITY_LEADER'
  | 'AUTHORITY_DISPATCHER'
  | 'SYSTEM_ADMIN';

export type ApplicationRole =
  | 'user'
  | 'community_manager'
  | 'authority'
  | 'admin'
  | 'super_admin';

export type UserRole = LegacyUserRole | ApplicationRole | string;

export interface UserSession {
  userId?: string;
  pseudonymId?: string;
  role: UserRole;
  canonicalRole?: CanonicalRole;
  communityId?: string;
  isAuthenticated: boolean;
}

/**
 * MANDATE: Anonymous users CANNOT submit incidents.
 * Enforces backend authorization gate.
 */
export function canSubmitIncident(session: UserSession): boolean {
  if (!session || !session.isAuthenticated) return false;
  if (session.role === 'ANONYMOUS' || session.role === 'anonymous') return false;
  return can(session, 'incident:create');
}


/**
 * MANDATE: Private community incidents are only visible to authorized community members.
 */
export function canViewPrivateCommunityIncidents(session: UserSession, targetCommunityId: string): boolean {
  if (!session || !session.isAuthenticated) return false;
  return can(session, 'community:view_private', { communityId: targetCommunityId });
}

/**
 * MANDATE: Decrypting precise location is strictly limited to authorized authority dispatchers during escalations.
 */
export function canAccessPreciseLocation(session: UserSession): boolean {
  if (!session || !session.isAuthenticated) return false;
  return can(session, 'incident:decrypt_location');
}

/**
 * MANDATE: Administration functions are strictly limited to admin or super_admin users.
 */
export function isSystemAdmin(session: UserSession): boolean {
  if (!session || !session.isAuthenticated) return false;
  const role = normalizeRole(session.role);
  return role === 'admin' || role === 'super_admin';
}

export function assertSystemAdmin(session: UserSession): void {
  if (!isSystemAdmin(session)) {
    throw new Error('UNAUTHORIZED: Administrative privileges are required for this operation.');
  }
}
