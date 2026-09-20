import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLocationDetails } from '../src/lib/location';
import { NextRequest } from 'next/server';
import { UserSession } from '../src/lib/auth';
import { signSessionToken } from '../src/lib/security';

const dbStore: Record<string, any> = {};

vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: (db: any, path?: string) => path || 'root',
  push: (refObj: string) => {
    const key = `inc_loc_${Math.random().toString(36).substring(2, 8)}`;
    return { key };
  },
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
  update: vi.fn(async (path: string, val: any) => {
    dbStore[path] = { ...(dbStore[path] || {}), ...val };
  }),
  onValue: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
}));

import { POST as createIncidentHandler } from '../src/app/api/incidents/route';

describe('Location Details & Map Metadata Tests', () => {
  const mockUser: UserSession = {
    userId: 'usr_loc_tester',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_lagos',
    isAuthenticated: true,
  };

  let authCookie: string;

  beforeEach(() => {
    for (const key of Object.keys(dbStore)) {
      delete dbStore[key];
    }
    authCookie = `antijj_session=${signSessionToken(mockUser)}`;
  });

  describe('resolveLocationDetails Helper', () => {
    it('parses comma-separated address into locationName, state, and country', () => {
      const result = resolveLocationDetails(
        6.5244,
        3.3792,
        'Ikeja Central, Lagos State, Nigeria',
      );

      expect(result.locationName).toBe('Ikeja Central');
      expect(result.state).toBe('Lagos State');
      expect(result.country).toBe('Nigeria');
      expect(result.formattedLocation).toBe('Ikeja Central, Lagos State, Nigeria');
    });

    it('uses provided explicit fields when present', () => {
      const result = resolveLocationDetails(
        6.5244,
        3.3792,
        'Main Gate',
        'Victoria Island',
        'Lagos State',
        'Nigeria'
      );

      expect(result.locationName).toBe('Victoria Island');
      expect(result.state).toBe('Lagos State');
      expect(result.country).toBe('Nigeria');
    });

    it('falls back to regional bounding box when no address is provided', () => {
      const lagosCoords = resolveLocationDetails(6.5244, 3.3792);
      expect(lagosCoords.state).toBe('Lagos State');
      expect(lagosCoords.country).toBe('Nigeria');

      const nairobiCoords = resolveLocationDetails(-1.2921, 36.8219);
      expect(nairobiCoords.state).toBe('Nairobi County');
      expect(nairobiCoords.country).toBe('Kenya');
    });

    it('falls back to default global zone when coordinates are outside known bounds', () => {
      const oceanCoords = resolveLocationDetails(0, 0);
      expect(oceanCoords.locationName).toBe('District Sector');
      expect(oceanCoords.country).toBe('Global Zone');
    });
  });

  describe('POST /api/incidents Location Resolution', () => {
    it('attaches locationName, state, and country to incident payload', async () => {
      const payload = {
        category: 'HAZARD_ALERT',
        title: 'Road Blockage Near Market',
        description: 'Fallen trees blocking two main lanes near the market area.',
        dangerLevel: 'HIGH',
        safetyConfirmed: true,
        incidentLocation: {
          latitude: 7.4343,
          longitude: 3.9004,
          address: 'Bodija Market, Oyo State, Nigeria',
        },
      };

      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${signSessionToken(mockUser)}`,
          Cookie: authCookie,
        },
        body: JSON.stringify(payload),
      });

      const res = await createIncidentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.incidentId).toBeDefined();

      const savedIncident = dbStore[`incidents/${json.incidentId}`];
      expect(savedIncident).toBeDefined();
      expect(savedIncident.incidentLocation).toBeDefined();
      expect(savedIncident.incidentLocation.locationName).toBe('Bodija Market');
      expect(savedIncident.incidentLocation.state).toBe('Oyo State');
      expect(savedIncident.incidentLocation.country).toBe('Nigeria');
    });
  });
});
