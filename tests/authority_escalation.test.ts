import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSession } from '../src/lib/auth';
import { signSessionToken } from '../src/lib/security';
import { resolveAuthorityDestination } from '../src/lib/authority/resolver';
import { MockAuthorityProvider } from '../src/lib/authority/providers/mockProvider';
import { AuthorityPayload, AuthorityDestination } from '../src/lib/authority/types';

// Mock Firebase module to avoid real network calls during unit tests
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

const mockDbStore: Record<string, any> = {};

vi.mock('firebase/database', () => ({
  ref: vi.fn((db: any, path: string) => ({ path })),
  get: vi.fn(async (reference: any) => {
    const path = reference.path || '';
    if (path.includes('incidents/inc_test_100')) {
      return {
        exists: () => true,
        val: () => ({
          id: 'inc_test_100',
          communityId: 'comm_central',
          category: 'CROWD_SAFETY_ALERT',
          title: 'Transit Gate Bottleneck',
          description: 'High volume crowd gathering near East Gate exit.',
          severity: 'HIGH',
          dangerLevel: 'HIGH',
          blurredLocation: { latitude: 40.7128, longitude: -74.006, geohash: 'dr5ru' },
          encryptedPreciseLocation: 'payload_encrypted',
          evidence: [
            { id: 'ev_1', url: 'http://img.png', type: 'image', name: 'gate.jpg' }
          ],
        }),
      };
    }
    if (mockDbStore[path]) {
      return {
        exists: () => true,
        val: () => mockDbStore[path],
      };
    }
    return { exists: () => false, val: () => null };
  }),
  set: vi.fn(async (reference: any, value: any) => {
    const path = reference.path || '';
    mockDbStore[path] = value;
  }),
  update: vi.fn(async (reference: any, value: any) => {
    const path = reference.path || '';
    mockDbStore[path] = { ...mockDbStore[path], ...value };
  }),
  push: vi.fn(),
}));

import { AuthorityNotificationService } from '../src/lib/authority/service';
import { POST as escalatePOST, GET as escalateGET } from '../src/app/api/authority/escalate/route';
import { POST as acknowledgePOST } from '../src/app/api/authority/acknowledge/route';
import { NextRequest } from 'next/server';

describe('Antijj Authority Notification Architecture & Escalation Workflow', () => {
  const citizenSession: UserSession = {
    userId: 'user_citizen_01',
    pseudonymId: 'pseudo_citizen01',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    isAuthenticated: true,
  };

  const leaderSession: UserSession = {
    userId: 'user_leader_01',
    pseudonymId: 'pseudo_leader01',
    role: 'VERIFIED_COMMUNITY_LEADER',
    communityId: 'comm_central',
    isAuthenticated: true,
  };

  const dispatcherSession: UserSession = {
    userId: 'user_dispatcher_01',
    pseudonymId: 'pseudo_dispatcher01',
    role: 'AUTHORITY_DISPATCHER',
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key in mockDbStore) delete mockDbStore[key];
  });

  describe('Geographic Authority Destination Resolver', () => {
    it('resolves specific authority destination by Geohash grid prefix', () => {
      const destDowntown = resolveAuthorityDestination(40.71, -74.0, 'dr5ru');
      expect(destDowntown.authorityId).toBe('auth_downtown_central');
      expect(destDowntown.name).toContain('Downtown Emergency Services');

      const destNorth = resolveAuthorityDestination(40.8, -74.1, 'dr5rv');
      expect(destNorth.authorityId).toBe('auth_north_transit');
      expect(destNorth.name).toContain('North Metro Transit');
    });

    it('falls back to central safety gateway for unknown geohashes', () => {
      const fallback = resolveAuthorityDestination(12.34, 56.78, 'xyz99');
      expect(fallback.authorityId).toBe('auth_national_safety_gateway');
    });
  });

  describe('Provider Abstraction & Notification Dispatch', () => {
    it('dispatches escalation and confirms delivery status DELIVERED via MockAuthorityProvider', async () => {
      const service = AuthorityNotificationService.getInstance(new MockAuthorityProvider());

      const record = await service.escalateIncidentToAuthority(
        leaderSession,
        'inc_test_100',
        'Urgent crowd safety bottleneck'
      );

      expect(record.status).toBe('DELIVERED');
      expect(record.authorityTarget).toContain('Downtown Emergency');
      expect(record.deliveryAttempts.length).toBe(1);
      expect(record.deliveryAttempts[0].status).toBe('DELIVERED');
      expect(record.payloadHash).toBeDefined();
    });

    it('does NOT mark incident as DELIVERED if provider fails delivery', async () => {
      const failingProvider = new MockAuthorityProvider({ simulateFailure: true });
      const service = AuthorityNotificationService.getInstance(failingProvider);

      const record = await service.escalateIncidentToAuthority(
        leaderSession,
        'inc_test_100',
        'Simulated outage test'
      );

      expect(record.status).toBe('FAILED');
      expect(record.deliveryAttempts[0].status).toBe('FAILED');
      expect(record.deliveryAttempts[0].error).toContain('MOCK_DISPATCH_TIMEOUT');
    });
  });

  describe('Status Lifecycle & Dispatcher Acknowledgment', () => {
    it('allows AUTHORITY_DISPATCHER to acknowledge an escalated incident', async () => {
      const service = AuthorityNotificationService.getInstance(new MockAuthorityProvider());

      await service.escalateIncidentToAuthority(leaderSession, 'inc_test_100');
      const ackRecord = await service.acknowledgeEscalation(dispatcherSession, 'inc_test_100');

      expect(ackRecord.status).toBe('ACKNOWLEDGED');
      expect(ackRecord.acknowledgedAt).toBeDefined();
      expect(ackRecord.acknowledgedByActorId).toBe('user_dispatcher_01');
    });
  });

  describe('Community Member Access Isolation & Security Rules', () => {
    it('rejects escalation attempts triggered by ordinary CITIZEN_MEMBER users with 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/authority/escalate', {
        method: 'POST',
        body: JSON.stringify({
          session: citizenSession,
          incidentId: 'inc_test_100',
          reason: 'Unauthorized escalation attempt',
        }),
      });

      const res = await escalatePOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('blocks ordinary CITIZEN_MEMBER users from reading authority escalation logs', async () => {
      const service = AuthorityNotificationService.getInstance();

      await expect(
        service.getEscalationStatus(citizenSession, 'inc_test_100')
      ).rejects.toThrow(/Community members are restricted from accessing authority escalation records/);
    });

    it('allows AUTHORITY_DISPATCHER to query escalation status via GET /api/authority/escalate', async () => {
      const service = AuthorityNotificationService.getInstance(new MockAuthorityProvider());
      await service.escalateIncidentToAuthority(leaderSession, 'inc_test_100');

      const token = signSessionToken(dispatcherSession);
      const req = new NextRequest(
        'http://localhost:3000/api/authority/escalate?incidentId=inc_test_100',
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );
      const res = await escalateGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.escalation.incidentId).toBe('inc_test_100');
    });
  });
});
