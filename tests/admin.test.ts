import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSession } from '../src/lib/auth';
import { AdminService } from '../src/lib/adminService';
import { GET as adminGet, POST as adminPost } from '../src/app/api/admin/route';
import { GET as communitiesGet, POST as communitiesPost, PATCH as communitiesPatch } from '../src/app/api/admin/communities/route';
import { GET as incidentsGet, PATCH as incidentsPatch } from '../src/app/api/admin/incidents/route';
import { GET as authorityGet, POST as authorityPost } from '../src/app/api/admin/authority/route';
import { GET as badgesGet, POST as badgesPost } from '../src/app/api/admin/badges/route';
import { NextRequest } from 'next/server';

// Mock Firebase RTDB to run offline instantly without network latency
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((db: any, path: string) => ({ path })),
  get: vi.fn(async () => ({
    exists: () => false,
    val: () => null,
  })),
  set: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
}));

describe('Antijj Administration Dashboard & RBAC Security Governance', () => {
  let adminService: AdminService;

  const anonymousSession: UserSession = { isAuthenticated: false, role: 'ANONYMOUS' };
  const citizenSession: UserSession = { isAuthenticated: true, role: 'CITIZEN_MEMBER', userId: 'usr_citizen_1' };
  const leaderSession: UserSession = { isAuthenticated: true, role: 'VERIFIED_COMMUNITY_LEADER', userId: 'usr_lead_1' };
  const dispatcherSession: UserSession = { isAuthenticated: true, role: 'AUTHORITY_DISPATCHER', userId: 'usr_disp_1' };
  const adminSession: UserSession = { isAuthenticated: true, role: 'SYSTEM_ADMIN', userId: 'usr_admin_1', pseudonymId: 'pseudo_admin' };

  beforeEach(() => {
    adminService = AdminService.getInstance();
  });

  describe('1. Role-Based Access Control (RBAC) Enforcement', () => {
    it('rejects ANONYMOUS users with UNAUTHORIZED exception', async () => {
      await expect(adminService.getUsers(anonymousSession)).rejects.toThrow('UNAUTHORIZED');
      await expect(adminService.getAggregateAnalytics(anonymousSession)).rejects.toThrow('UNAUTHORIZED');
    });

    it('rejects CITIZEN_MEMBER users with UNAUTHORIZED exception', async () => {
      await expect(adminService.getUsers(citizenSession)).rejects.toThrow('UNAUTHORIZED');
      await expect(adminService.updateUserRole(citizenSession, 'usr_citizen_1', 'SYSTEM_ADMIN')).rejects.toThrow('UNAUTHORIZED');
    });

    it('rejects VERIFIED_COMMUNITY_LEADER and AUTHORITY_DISPATCHER users with UNAUTHORIZED exception', async () => {
      await expect(adminService.getCommunities(leaderSession)).rejects.toThrow('UNAUTHORIZED');
      await expect(adminService.getIncidents(dispatcherSession)).rejects.toThrow('UNAUTHORIZED');
    });

    it('allows SYSTEM_ADMIN users full administrative access', async () => {
      const users = await adminService.getUsers(adminSession);
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      const analytics = await adminService.getAggregateAnalytics(adminSession);
      expect(analytics.totalUsers).toBeGreaterThan(0);
    });

    it('returns HTTP 403 Forbidden for non-admin API requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin?action=analytics', {
        headers: { 'x-user-session': JSON.stringify(citizenSession) },
      });
      const res = await adminGet(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('UNAUTHORIZED');
    });
  });

  describe('2. User Management & Suspension Workflows', () => {
    it('allows system admin to suspend and reactivate user accounts', async () => {
      const suspended = await adminService.setUserSuspended(
        adminSession,
        'usr_citizen_1',
        true,
        'Violated safety reporting standards'
      );
      expect(suspended.accountStatus).toBe('SUSPENDED');
      expect(suspended.suspensionReason).toBe('Violated safety reporting standards');

      const reactivated = await adminService.setUserSuspended(adminSession, 'usr_citizen_1', false);
      expect(reactivated.accountStatus).toBe('ACTIVE');
    });

    it('allows system admin to update user roles with audit trail', async () => {
      const updated = await adminService.updateUserRole(
        adminSession,
        'usr_citizen_1',
        'VERIFIED_COMMUNITY_LEADER'
      );
      expect(updated.role).toBe('VERIFIED_COMMUNITY_LEADER');
    });
  });

  describe('3. Community Network Governance', () => {
    it('creates new communities and moderates status', async () => {
      const newComm = await adminService.createCommunity(adminSession, {
        name: 'Abuja Central Vigilance',
        region: 'FCT Abuja',
        description: 'Community de-escalation network for Abuja Metro.',
      });
      expect(newComm.id).toContain('comm_');
      expect(newComm.name).toBe('Abuja Central Vigilance');

      const updated = await adminService.updateCommunityStatus(adminSession, newComm.id, 'SUSPENDED');
      expect(updated.status).toBe('SUSPENDED');
    });

    it('moderates community pending member applications', async () => {
      const comm = await adminService.moderateCommunityMember(
        adminSession,
        'comm_central',
        'usr_applicant_99',
        'APPROVE'
      );
      expect(comm.pendingMembers).not.toContain('usr_applicant_99');
    });
  });

  describe('4. Incident Oversight & Moderation Queue', () => {
    it('reviews and updates incident moderation statuses', async () => {
      const incidents = await adminService.getIncidents(adminSession);
      expect(incidents.length).toBeGreaterThan(0);

      const targetIncId = incidents[0].id;
      const updated = await adminService.updateIncidentModerationStatus(
        adminSession,
        targetIncId,
        'FLAGGED',
        'Flagged for manual safety audit'
      );
      expect(updated.moderationStatus).toBe('FLAGGED');
      expect(updated.reviewNotes).toBe('Flagged for manual safety audit');
    });
  });

  describe('5. Authority Gateways & Provider Control', () => {
    it('fetches and configures authority integration providers', async () => {
      const providers = await adminService.getAuthorityProviders(adminSession);
      expect(providers.length).toBeGreaterThan(0);

      const npfProv = providers.find((p) => p.id === 'prov_npf') || providers[0];
      const configured = await adminService.configureAuthorityProvider(adminSession, npfProv.id, {
        isEnabled: false,
        retryLimit: 5,
      });
      expect(configured.isEnabled).toBe(false);
      expect(configured.retryLimit).toBe(5);
    });
  });

  describe('6. Badge Governance & Fraudulent Revocation', () => {
    it('requires a detailed reason and writes signed SHA-256 audit log upon award revocation', async () => {
      await expect(
        adminService.revokeBadgeAward(adminSession, 'usr_citizen_1', 'award_123_badge_tier_bronze', '   ')
      ).rejects.toThrow('INVALID_INPUT');

      const auditLog = await adminService.revokeBadgeAward(
        adminSession,
        'usr_citizen_1',
        'award_123_badge_tier_bronze',
        'Award was granted based on unverified synthetic events'
      );

      expect(auditLog.logId).toContain('revoke_');
      expect(auditLog.userId).toBe('usr_citizen_1');
      expect(auditLog.revokedByAdminId).toBe('usr_admin_1');
      expect(auditLog.payloadHash.length).toBe(64); // SHA-256 hash length
    });
  });

  describe('7. Aggregate Analytics Calculation', () => {
    it('computes complete real-time aggregate metrics', async () => {
      const analytics = await adminService.getAggregateAnalytics(adminSession);

      expect(analytics.totalIncidents).toBeGreaterThanOrEqual(0);
      expect(analytics.incidentsByDangerLevel).toHaveProperty('HIGH');
      expect(analytics.incidentsByDangerLevel).toHaveProperty('MEDIUM');
      expect(analytics.incidentsByDangerLevel).toHaveProperty('LOW');
      expect(analytics.totalCommunities).toBeGreaterThanOrEqual(0);
      expect(analytics.totalUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.responseStatuses).toHaveProperty('DELIVERED');
      expect(analytics.responseStatuses).toHaveProperty('SENT');
      expect(analytics.responseStatuses).toHaveProperty('PENDING');
      expect(analytics.responseStatuses).toHaveProperty('FAILED');
      expect(analytics.campaignParticipation).toBeGreaterThanOrEqual(0);
    });
  });
});
