import { describe, it, expect, vi } from 'vitest';
import { canSubmitIncident, canViewPrivateCommunityIncidents, canAccessPreciseLocation, UserSession } from '../../auth';

vi.mock('../client', () => ({
  auth: {},
  rtdb: {},
  app: {},
  storage: {},
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  deleteUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ exists: () => false }),
}));

describe('Antijj Auth & Security Authorization Rules', () => {
  describe('canSubmitIncident Authorization Gate', () => {
    it('returns false for ANONYMOUS users', () => {
      const session: UserSession = { role: 'ANONYMOUS', isAuthenticated: true };
      expect(canSubmitIncident(session)).toBe(false);
    });

    it('returns false for unauthenticated visitors', () => {
      const session: UserSession = { role: 'ANONYMOUS', isAuthenticated: false };
      expect(canSubmitIncident(session)).toBe(false);
    });

    it('returns true for CITIZEN_MEMBER users', () => {
      const session: UserSession = { role: 'CITIZEN_MEMBER', isAuthenticated: true, userId: 'u1' };
      expect(canSubmitIncident(session)).toBe(true);
    });
  });

  describe('canViewPrivateCommunityIncidents Gate', () => {
    it('blocks access if user is from a different community', () => {
      const session: UserSession = { role: 'CITIZEN_MEMBER', isAuthenticated: true, communityId: 'comm_A' };
      expect(canViewPrivateCommunityIncidents(session, 'comm_B')).toBe(false);
    });

    it('allows access if user belongs to target community', () => {
      const session: UserSession = { role: 'CITIZEN_MEMBER', isAuthenticated: true, communityId: 'comm_A' };
      expect(canViewPrivateCommunityIncidents(session, 'comm_A')).toBe(true);
    });

    it('allows AUTHORITY_DISPATCHER to view any community', () => {
      const session: UserSession = { role: 'AUTHORITY_DISPATCHER', isAuthenticated: true, communityId: 'comm_X' };
      expect(canViewPrivateCommunityIncidents(session, 'comm_B')).toBe(true);
    });
  });

  describe('canAccessPreciseLocation Gate', () => {
    it('blocks CITIZEN_MEMBER from reading precise coordinates', () => {
      const session: UserSession = { role: 'CITIZEN_MEMBER', isAuthenticated: true };
      expect(canAccessPreciseLocation(session)).toBe(false);
    });

    it('allows AUTHORITY_DISPATCHER to access precise location', () => {
      const session: UserSession = { role: 'AUTHORITY_DISPATCHER', isAuthenticated: true };
      expect(canAccessPreciseLocation(session)).toBe(true);
    });
  });
});
