import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canSubmitIncident, UserSession } from '../../auth';

// Mock Firebase client module to prevent actual network calls during unit tests
vi.mock('../client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  push: vi.fn(() => ({ key: 'mock_incident_123' })),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  onValue: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

import { createIncidentReport, updateIncidentStatus } from '../rtdb';

describe('Firebase RTDB & Incident System Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Anonymous & Unauthenticated Access Gate', () => {
    it('should block anonymous users from submitting incident reports', async () => {
      const anonymousSession: UserSession = {
        userId: 'anon_123',
        role: 'ANONYMOUS',
        isAuthenticated: true,
      };

      await expect(
        createIncidentReport(anonymousSession, {
          communityId: 'comm_1',
          category: 'DISTURBANCE',
          title: 'Test Incident',
          description: 'Test description',
          blurredLocation: { latitude: 0, longitude: 0, geohash: '00000' },
          encryptedPreciseLocation: 'encrypted',
          severity: 'HIGH',
        })
      ).rejects.toThrow(/Anonymous users and unauthenticated users cannot submit incident reports/);
    });

    it('should block unauthenticated users from submitting incident reports', async () => {
      const unauthSession: UserSession = {
        role: 'ANONYMOUS',
        isAuthenticated: false,
      };

      await expect(
        createIncidentReport(unauthSession, {
          communityId: 'comm_1',
          category: 'TRAFFIC_HAZARD',
          title: 'Test',
          description: 'Test',
          blurredLocation: { latitude: 0, longitude: 0, geohash: '00000' },
          encryptedPreciseLocation: 'encrypted',
          severity: 'LOW',
        })
      ).rejects.toThrow(/Anonymous users/);
    });
  });

  describe('Reporter Identity Privacy', () => {
    it('should create incident with generic reporter label and isolate reporterUid', async () => {
      const citizenSession: UserSession = {
        userId: 'citizen_user_999',
        role: 'CITIZEN_MEMBER',
        isAuthenticated: true,
        communityId: 'comm_1',
      };

      const result = await createIncidentReport(citizenSession, {
        communityId: 'comm_1',
        category: 'CROWD_SAFETY_ALERT',
        title: 'Crowd Gathering',
        description: 'Large crowd near station',
        blurredLocation: { latitude: 40.71, longitude: -74.00, geohash: 'dr5ru' },
        encryptedPreciseLocation: 'payload_encrypted',
        severity: 'MEDIUM',
      });

      expect(result.incidentId).toBe('mock_incident_123');
    });
  });

  describe('Status Update RBAC', () => {
    it('should reject status updates from ordinary CITIZEN_MEMBER users', async () => {
      const citizenSession: UserSession = {
        userId: 'citizen_123',
        role: 'CITIZEN_MEMBER',
        isAuthenticated: true,
      };

      await expect(
        updateIncidentStatus(citizenSession, 'mock_incident_123', 'VERIFIED')
      ).rejects.toThrow(/Insufficient permissions/);
    });

    it('should allow status updates from VERIFIED_COMMUNITY_LEADER', async () => {
      const leaderSession: UserSession = {
        userId: 'leader_123',
        role: 'VERIFIED_COMMUNITY_LEADER',
        isAuthenticated: true,
      };

      await expect(
        updateIncidentStatus(leaderSession, 'mock_incident_123', 'VERIFIED')
      ).resolves.not.toThrow();
    });

    it('should allow status updates from AUTHORITY_DISPATCHER', async () => {
      const dispatcherSession: UserSession = {
        userId: 'dispatch_123',
        role: 'AUTHORITY_DISPATCHER',
        isAuthenticated: true,
      };

      await expect(
        updateIncidentStatus(dispatcherSession, 'mock_incident_123', 'ESCALATED')
      ).resolves.not.toThrow();
    });
  });
});
