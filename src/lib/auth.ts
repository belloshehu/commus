export type UserRole = 
  | 'ANONYMOUS'
  | 'CITIZEN_MEMBER'
  | 'VERIFIED_COMMUNITY_LEADER'
  | 'AUTHORITY_DISPATCHER'
  | 'SYSTEM_ADMIN';

export interface UserSession {
  userId?: string;
  pseudonymId?: string;
  role: UserRole;
  communityId?: string;
  isAuthenticated: boolean;
}

/**
 * MANDATE: Anonymous users CANNOT submit incidents.
 * Enforces backend authorization gate.
 */
export function canSubmitIncident(session: UserSession): boolean {
  if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
    return false;
  }
  return ['CITIZEN_MEMBER', 'VERIFIED_COMMUNITY_LEADER', 'AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN'].includes(session.role);
}

/**
 * MANDATE: Private community incidents are only visible to authorized community members.
 */
export function canViewPrivateCommunityIncidents(session: UserSession, targetCommunityId: string): boolean {
  if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
    return false;
  }
  if (session.role === 'SYSTEM_ADMIN' || session.role === 'AUTHORITY_DISPATCHER') {
    return true;
  }
  return session.communityId === targetCommunityId;
}

/**
 * MANDATE: Decrypting precise location is strictly limited to authorized authority dispatchers during escalations.
 */
export function canAccessPreciseLocation(session: UserSession): boolean {
  return session.isAuthenticated && (session.role === 'AUTHORITY_DISPATCHER' || session.role === 'SYSTEM_ADMIN');
}

/**
 * MANDATE: Administration functions are strictly limited to SYSTEM_ADMIN users.
 */
export function isSystemAdmin(session: UserSession): boolean {
  return Boolean(session.isAuthenticated && session.role === 'SYSTEM_ADMIN');
}

export function assertSystemAdmin(session: UserSession): void {
  if (!isSystemAdmin(session)) {
    throw new Error('UNAUTHORIZED: SYSTEM_ADMIN privileges are required for this administrative operation.');
  }
}

