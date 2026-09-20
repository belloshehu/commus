import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserSession } from '../src/lib/auth';
import { NextRequest } from 'next/server';
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
    const key = `inc_mock_${Math.random().toString(36).substring(2, 8)}`;
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

import { recordVote, getUserVote, createIncidentReport } from '../src/lib/firebase/rtdb';
import { POST as voteApiHandler } from '../src/app/api/incidents/[id]/vote/route';
import { POST as createIncidentApiHandler } from '../src/app/api/incidents/route';

describe('Community Incident Feed Voting, Authenticity & Notification Workflow Suite', () => {
  const memberSession1: UserSession = {
    isAuthenticated: true,
    userId: 'user_voter_001',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    pseudonymId: 'pseudo_voter_001',
  };

  const memberSession2: UserSession = {
    isAuthenticated: true,
    userId: 'user_voter_002',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    pseudonymId: 'pseudo_voter_002',
  };

  const memberSession3: UserSession = {
    isAuthenticated: true,
    userId: 'user_voter_003',
    role: 'CITIZEN_MEMBER',
    communityId: 'comm_central',
    pseudonymId: 'pseudo_voter_003',
  };

  let testIncidentId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    Object.keys(dbStore).forEach((k) => delete dbStore[k]);

    const created = await createIncidentReport(memberSession1, {
      communityId: 'comm_central',
      category: 'TRAFFIC_HAZARD',
      title: 'Oil Spill on Expressway',
      description: 'Major oil slick causing vehicles to skid near Exit 4.',
      blurredLocation: { latitude: 40.71, longitude: -74.0, geohash: 'geo_407_-740' },
      encryptedPreciseLocation: 'enc_loc_xyz',
      severity: 'HIGH',
      dangerLevel: 'HIGH',
      safetyConfirmed: true,
    });
    testIncidentId = created.incidentId;
  });

  it('allows verified community members to upvote a safety report', async () => {
    const res = await recordVote(memberSession1, testIncidentId, 'UP');
    expect(res.upvotes).toBe(1);
    expect(res.downvotes).toBe(0);
    expect(res.userVote).toBe('UP');

    const vote = await getUserVote(memberSession1, testIncidentId);
    expect(vote).toBe('UP');
  });

  it('toggles vote off when clicking the same vote button again', async () => {
    await recordVote(memberSession1, testIncidentId, 'UP');
    const res2 = await recordVote(memberSession1, testIncidentId, 'UP');

    expect(res2.upvotes).toBe(0);
    expect(res2.downvotes).toBe(0);
    expect(res2.userVote).toBeNull();
  });

  it('flags report as QUESTIONABLE_AUTHENTICITY when downvotes exceed 20%', async () => {
    // Member 1 upvotes
    await recordVote(memberSession1, testIncidentId, 'UP');
    // Member 2 downvotes (downvote ratio: 1/2 = 50% > 20%)
    const res2 = await recordVote(memberSession2, testIncidentId, 'DOWN');

    expect(res2.upvotes).toBe(1);
    expect(res2.downvotes).toBe(1);
    expect(res2.authenticityStatus).toBe('QUESTIONABLE_AUTHENTICITY');
  });

  it('marks report as VERIFIED_COMMUNITY when upvotes reach 3 and downvotes stay <= 20%', async () => {
    await recordVote(memberSession1, testIncidentId, 'UP');
    await recordVote(memberSession2, testIncidentId, 'UP');
    const res3 = await recordVote(memberSession3, testIncidentId, 'UP');

    expect(res3.upvotes).toBe(3);
    expect(res3.downvotes).toBe(0);
    expect(res3.authenticityStatus).toBe('VERIFIED_COMMUNITY');
  });

  it('processes voting via POST /api/incidents/[id]/vote HTTP endpoint', async () => {
    const token = signSessionToken({
      userId: memberSession1.userId,
      role: memberSession1.role,
      communityId: memberSession1.communityId,
      isAuthenticated: true,
    });

    const req = new NextRequest(`http://localhost:3000/api/incidents/${testIncidentId}/vote`, {
      method: 'POST',
      headers: {
        'x-antijj-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voteType: 'UP' }),
    });

    const res = await voteApiHandler(req, { params: Promise.resolve({ id: testIncidentId }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.upvotes).toBe(1);
    expect(json.userVote).toBe('UP');
  });

  it('dispatches member notifications and authority escalation upon report creation API call', async () => {
    const token = signSessionToken({
      userId: memberSession1.userId,
      role: memberSession1.role,
      communityId: memberSession1.communityId,
      isAuthenticated: true,
    });

    const req = new NextRequest('http://localhost:3000/api/incidents', {
      method: 'POST',
      headers: {
        'x-antijj-session-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        communityId: 'comm_central',
        category: 'CROWD_SAFETY_ALERT',
        title: 'Bottleneck Congestion at Main Gate',
        description: 'Large crowd surging at gate entrance. High congestion.',
        dangerLevel: 'HIGH',
        safetyConfirmed: true,
        incidentLocation: {
          latitude: 40.7128,
          longitude: -74.006,
          address: 'Main Entrance Gate',
        },
      }),
    });

    const res = await createIncidentApiHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.incidentId).toBeTruthy();
    expect(json.authorityStatus).toBeDefined();
  });
});
