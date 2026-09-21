import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscribeToAllIncidents } from '../src/lib/firebase/rtdb';
import { filterIncidents } from '../src/components/dashboard/IncidentFeed';
import { IncidentCardData } from '../src/components/ui/IncidentCard';

const dbStore: Record<string, any> = {};
let onValueCallback: any = null;

vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: (db: any, path?: string) => path || 'root',
  push: (refObj: string) => ({ key: `inc_mock_${Math.random().toString(36).substring(2, 8)}` }),
  get: vi.fn(async (path: string) => {
    const val = dbStore[path];
    return {
      exists: () => val !== undefined && val !== null,
      val: () => val,
    };
  }),
  set: vi.fn(async (path: string, val: any) => {
    dbStore[path] = val;
  }),
  onValue: vi.fn((refObj: any, callback: any) => {
    onValueCallback = callback;
    // Immediately invoke with current dbStore state
    const val = dbStore['incidents'];
    callback({
      val: () => val || null,
    });
    return () => {};
  }),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

describe('Realtime Database Feed & Actionable Empty State Tests', () => {
  beforeEach(() => {
    for (const key of Object.keys(dbStore)) {
      delete dbStore[key];
    }
  });

  describe('subscribeToAllIncidents Subscription', () => {
    it('returns empty array when database node has no incidents', () => {
      let received: any[] = [];
      subscribeToAllIncidents((incidents) => {
        received = incidents;
      });

      expect(received).toEqual([]);
    });

    it('syncs live incidents sorted by createdAt newest first', () => {
      dbStore['incidents'] = {
        inc_old: {
          id: 'inc_old',
          category: 'INFRASTRUCTURE_FAILURE',
          title: 'Old Hazard',
          description: 'Old infrastructure problem',
          createdAt: 1000,
        },
        inc_new: {
          id: 'inc_new',
          category: 'CROWD_SAFETY_ALERT',
          title: 'Recent Crowd Alert',
          description: 'High volume crowd reported recently',
          createdAt: 5000,
        },
      };

      let received: any[] = [];
      subscribeToAllIncidents((incidents) => {
        received = incidents;
      });

      expect(received.length).toBe(2);
      expect(received[0].id).toBe('inc_new');
      expect(received[1].id).toBe('inc_old');
      expect(received[0].reporterLabel).toBe('Reported by a verified community member');
    });
  });

  describe('Incident Feed Filter & Empty State Rules', () => {
    const mockList: IncidentCardData[] = [
      {
        id: 'inc_1',
        communityId: 'comm_central',
        category: 'TRAFFIC_HAZARD',
        title: 'Road Hazard',
        description: 'Road blocked',
        reporterLabel: 'Reported by a verified community member',
        blurredLocation: { latitude: 6.5, longitude: 3.3, geohash: 'geo_65_33' },
        severity: 'HIGH',
        status: 'SUBMITTED',
        createdAt: Date.now(),
      },
    ];

    it('returns matching incidents when filter matches communityId and category', () => {
      const filtered = filterIncidents(mockList, {
        searchQuery: '',
        dangerLevel: 'ALL',
        communityId: 'comm_central',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
        categoryFilter: 'TRAFFIC_HAZARD',
      });

      expect(filtered.length).toBe(1);
    });

    it('returns 0 filtered results when search query does not match', () => {
      const filtered = filterIncidents(mockList, {
        searchQuery: 'nonexistent keyword query',
        dangerLevel: 'ALL',
        communityId: 'comm_central',
        timeFilter: 'ALL',
        statusFilter: 'ALL',
        categoryFilter: 'ALL',
      });

      expect(filtered.length).toBe(0);
    });
  });
});
