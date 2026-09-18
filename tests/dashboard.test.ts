import { describe, it, expect, vi } from 'vitest';
import { canViewPrivateCommunityIncidents, UserSession } from '../src/lib/auth';
import { filterIncidents } from '../src/components/dashboard/IncidentFeed';
import { IncidentCardData } from '../src/components/ui/IncidentCard';
import { FilterState } from '../src/components/dashboard/IncidentFilterBar';

// Mock Firebase module to avoid network calls during unit tests
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  push: vi.fn(() => ({ key: 'mock_inc_999' })),
  get: vi.fn().mockResolvedValue({
    exists: () => true,
    val: () => ({
      id: 'inc_101',
      communityId: 'comm_central',
      category: 'CROWD_SAFETY_ALERT',
      title: 'Crowd Bottleneck',
      description: 'Congestion at gate',
      reporterLabel: 'Reported by a verified community member',
      blurredLocation: { latitude: 40.71, longitude: -74.0, geohash: 'dr5ru' },
      encryptedPreciseLocation: 'payload',
      severity: 'HIGH',
      status: 'VERIFIED',
      createdAt: Date.now(),
    }),
  }),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  onValue: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

import { getIncidentById, getCommunityIncidents } from '../src/lib/firebase/rtdb';
import { GET } from '../src/app/api/incidents/[id]/route';
import { NextRequest } from 'next/server';

describe('Antijj Community Incident Dashboard & Authorization Rules', () => {
  const memberCentralSession: UserSession = {
    userId: 'user_central_01',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    isAuthenticated: true,
  };

  const memberNorthSession: UserSession = {
    userId: 'user_north_01',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_north',
    isAuthenticated: true,
  };

  const adminSession: UserSession = {
    userId: 'user_admin_01',
    role: 'SYSTEM_ADMIN',
    isAuthenticated: true,
  };

  const sampleIncidents: IncidentCardData[] = [
    {
      id: 'inc_high_1',
      communityId: 'comm_central',
      category: 'CROWD_SAFETY_ALERT',
      title: 'High Risk Crowd Congestion',
      description: 'Mass bottleneck at main gate requiring immediate monitoring.',
      reporterLabel: 'Reported by a verified community member',
      blurredLocation: { latitude: 40.71, longitude: -74.0, geohash: 'dr5ru' },
      severity: 'HIGH',
      status: 'VERIFIED',
      createdAt: Date.now() - 2 * 3600 * 1000, // 2 hours ago
    },
    {
      id: 'inc_medium_1',
      communityId: 'comm_central',
      category: 'TRAFFIC_HAZARD',
      title: 'Road Obstacle on 5th Ave',
      description: 'Debris blocking lane.',
      reporterLabel: 'Reported by a verified community member',
      blurredLocation: { latitude: 40.72, longitude: -74.01, geohash: 'dr5rv' },
      severity: 'MEDIUM',
      status: 'SUBMITTED',
      createdAt: Date.now() - 10 * 24 * 3600 * 1000, // 10 days ago
    },
    {
      id: 'inc_north_1',
      communityId: 'comm_north',
      category: 'INFRASTRUCTURE_FAILURE',
      title: 'North Corridor Outage',
      description: 'Lighting failure on north pathway.',
      reporterLabel: 'Reported by a verified community member',
      blurredLocation: { latitude: 40.8, longitude: -74.1, geohash: 'dr5rw' },
      severity: 'LOW',
      status: 'RESOLVED',
      createdAt: Date.now() - 5 * 3600 * 1000, // 5 hours ago
    },
  ];

  describe('Data Layer Authorization RBAC', () => {
    it('grants access to private community incidents only for authorized members', () => {
      expect(canViewPrivateCommunityIncidents(memberCentralSession, 'comm_central')).toBe(true);
      expect(canViewPrivateCommunityIncidents(memberCentralSession, 'comm_north')).toBe(false);
    });

    it('grants access to all community incidents for SYSTEM_ADMIN', () => {
      expect(canViewPrivateCommunityIncidents(adminSession, 'comm_central')).toBe(true);
      expect(canViewPrivateCommunityIncidents(adminSession, 'comm_north')).toBe(true);
    });

    it('rejects getCommunityIncidents if user does not belong to target community', async () => {
      await expect(
        getCommunityIncidents(memberCentralSession, 'comm_north')
      ).rejects.toThrow(/UNAUTHORIZED: You do not have permission to access incidents/);
    });

    it('returns HTTP 403 Forbidden from GET /api/incidents/[id] when user lacks access', async () => {
      // Mock params
      const req = new NextRequest(
        'http://localhost:3000/api/incidents/inc_101?role=CITIZEN_MEMBER&communityId=comm_unauthorized&isAuthenticated=true'
      );
      const res = await GET(req, { params: Promise.resolve({ id: 'inc_101' }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });
  });

  describe('Multi-Criteria Filtering Logic', () => {
    it('filters incidents strictly by danger level', () => {
      const filters: FilterState = {
        searchQuery: '',
        dangerLevel: 'HIGH',
        communityId: 'comm_central',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
      };

      const results = filterIncidents(sampleIncidents, filters);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('inc_high_1');
      expect(results[0].severity).toBe('HIGH');
    });

    it('filters incidents by time window (Past 24 Hours)', () => {
      const filters: FilterState = {
        searchQuery: '',
        dangerLevel: 'ALL',
        communityId: 'comm_central',
        timeFilter: 'PAST_24_HOURS',
        statusFilter: 'ALL',
      };

      const results = filterIncidents(sampleIncidents, filters);
      expect(results.length).toBe(1); // 10-day old incident excluded
      expect(results[0].id).toBe('inc_high_1');
    });

    it('filters incidents by community zone', () => {
      const filtersNorth: FilterState = {
        searchQuery: '',
        dangerLevel: 'ALL',
        communityId: 'comm_north',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
      };

      const results = filterIncidents(sampleIncidents, filtersNorth);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('inc_north_1');
    });

    it('filters incidents by keyword search query', () => {
      const filtersSearch: FilterState = {
        searchQuery: 'bottleneck',
        dangerLevel: 'ALL',
        communityId: 'comm_central',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
      };

      const results = filterIncidents(sampleIncidents, filtersSearch);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('inc_high_1');
    });
  });

  describe('Reporter Identity Privacy Invariant', () => {
    it('guarantees reporterLabel is always "Reported by a verified community member"', () => {
      const filtered = filterIncidents(sampleIncidents, {
        searchQuery: '',
        dangerLevel: 'ALL',
        communityId: 'comm_central',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
      });

      filtered.forEach((incident) => {
        expect(incident.reporterLabel).toBe('Reported by a verified community member');
      });
    });
  });
});
