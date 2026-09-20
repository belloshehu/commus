import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { UserSession, canViewPrivateCommunityIncidents, canAccessPreciseLocation } from '../src/lib/auth';
import {
  authenticateServerSession,
  checkRateLimit,
  sanitizeHtmlText,
  sanitizeEvidenceUrl,
  signSessionToken,
} from '../src/lib/security';

import { GET as adminGet } from '../src/app/api/admin/route';
import { GET as getIncidentApi } from '../src/app/api/incidents/[id]/route';
import { POST as postIncidentApi } from '../src/app/api/incidents/route';
import { POST as escalateApi } from '../src/app/api/authority/escalate/route';
import { POST as evaluateBadgesApi } from '../src/app/api/badges/evaluate/route';
import { GET as getNotificationsApi, POST as postNotificationsApi } from '../src/app/api/notifications/route';

// Mock Firebase RTDB to run offline instantly without network latency
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn((db: any, path: string) => ({ path })),
  get: vi.fn(async (reference: any) => {
    const path = reference?.path || '';
    if (path.includes('incidents/inc_priv_99')) {
      return {
        exists: () => true,
        val: () => ({
          id: 'inc_priv_99',
          communityId: 'comm_private_zone',
          title: 'Private Incident',
          description: 'Sensitive private community incident',
          blurredLocation: { latitude: 9.07, longitude: 7.39 },
          severity: 'HIGH',
        }),
      };
    }
    return {
      exists: () => false,
      val: () => null,
    };
  }),
  set: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
}));

describe('Antijj Comprehensive Security Audit & Threat Remediation Test Suite', () => {
  const anonymousSession: UserSession = { isAuthenticated: false, role: 'ANONYMOUS' };
  const citizenSession: UserSession = {
    isAuthenticated: true,
    role: 'CITIZEN_MEMBER',
    userId: 'usr_citizen_alpha',
    communityId: 'comm_central',
  };
  const adminSession: UserSession = {
    isAuthenticated: true,
    role: 'SYSTEM_ADMIN',
    userId: 'usr_admin_prime',
    pseudonymId: 'pseudo_admin',
  };

  describe('1. Authentication & Session Forgery Prevention', () => {
    it('rejects un-signed, client-spoof header x-user-session without valid secret', () => {
      const req = new NextRequest('http://localhost:3000/api/admin', {
        headers: { 'x-user-session': JSON.stringify({ role: 'SYSTEM_ADMIN', isAuthenticated: true }) },
      });
      const session = authenticateServerSession(req);
      expect(session.role).toBe('ANONYMOUS');
      expect(session.isAuthenticated).toBe(false);
    });

    it('validates cryptographically signed server tokens', () => {
      const validToken = signSessionToken(adminSession);
      const req = new NextRequest('http://localhost:3000/api/admin', {
        headers: { authorization: `Bearer ${validToken}` },
      });
      const session = authenticateServerSession(req);
      expect(session.role).toBe('SYSTEM_ADMIN');
      expect(session.isAuthenticated).toBe(true);
    });

    it('rejects query parameter authorization bypass attempts in GET requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/incidents/inc_priv_99?role=SYSTEM_ADMIN&isAuthenticated=true');
      const res = await getIncidentApi(req, { params: Promise.resolve({ id: 'inc_priv_99' }) });
      expect(res.status).toBe(403);
    });
  });

  describe('2. Authorization & Privacy Isolation', () => {
    it('enforces community boundary isolation for private incidents', () => {
      const otherCommunitySession: UserSession = {
        isAuthenticated: true,
        role: 'CITIZEN_MEMBER',
        userId: 'user_other',
        communityId: 'comm_other_district',
      };
      expect(canViewPrivateCommunityIncidents(otherCommunitySession, 'comm_private_zone')).toBe(false);
    });

    it('restricts user notification fetching to owned recipientUserId', async () => {
      const signedToken = signSessionToken(citizenSession);
      const req = new NextRequest('http://localhost:3000/api/notifications?userId=usr_victim_target', {
        headers: { authorization: `Bearer ${signedToken}` },
      });

      const res = await getNotificationsApi(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('rejects unauthorized notification dispatch by ordinary citizen members', async () => {
      const signedToken = signSessionToken(citizenSession);
      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${signedToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          recipientUserId: 'target_user',
          eventType: 'SYSTEM_ALERT',
          title: 'Fake Spam',
          message: 'Spam alert',
        }),
      });

      const res = await postNotificationsApi(req);
      expect(res.status).toBe(403);
    });
  });

  describe('3. Admin & Escalation Protection', () => {
    it('blocks admin endpoint GET /api/admin for unauthenticated/citizen requests', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin?action=analytics');
      const res = await adminGet(req);
      expect(res.status).toBe(403);
    });

    it('blocks authority escalation API for ordinary CITIZEN_MEMBER users', async () => {
      const signedToken = signSessionToken(citizenSession);
      const req = new NextRequest('http://localhost:3000/api/authority/escalate', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${signedToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ incidentId: 'inc_101', reason: 'High alert' }),
      });

      const res = await escalateApi(req);
      expect(res.status).toBe(403);
    });

    it('restricts precise location decryption access to authority dispatchers & admins only', () => {
      expect(canAccessPreciseLocation(citizenSession)).toBe(false);
      expect(canAccessPreciseLocation(anonymousSession)).toBe(false);
      expect(canAccessPreciseLocation(adminSession)).toBe(true);
    });
  });

  describe('4. Evidence & Storage URL Security', () => {
    it('rejects malicious URL schemes (javascript:, data:, file:)', () => {
      expect(() => sanitizeEvidenceUrl('javascript:alert(1)')).toThrow('SECURITY_VIOLATION');
      expect(() => sanitizeEvidenceUrl('data:text/html,<script>alert(1)</script>')).toThrow('SECURITY_VIOLATION');
      expect(() => sanitizeEvidenceUrl('file:///etc/passwd')).toThrow('SECURITY_VIOLATION');
    });

    it('allows HTTPS and trusted local storage URLs', () => {
      expect(sanitizeEvidenceUrl('https://storage.googleapis.com/antijj/evidence.jpg')).toBe(
        'https://storage.googleapis.com/antijj/evidence.jpg'
      );
      expect(sanitizeEvidenceUrl('http://localhost:3000/evidence/sample.mp4')).toBe(
        'http://localhost:3000/evidence/sample.mp4'
      );
    });

    it('rejects incident reports with malicious evidence URLs', async () => {
      const signedToken = signSessionToken(citizenSession);
      const req = new NextRequest('http://localhost:3000/api/incidents', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${signedToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Valid Title Incident',
          description: 'Valid detailed incident description of sufficient length.',
          dangerLevel: 'HIGH',
          safetyConfirmed: true,
          incidentLocation: { latitude: 9.07, longitude: 7.39 },
          evidence: [{ id: 'ev1', url: 'javascript:alert(1)' }],
        }),
      });

      const res = await postIncidentApi(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('VALIDATION_FAILED');
    });
  });

  describe('5. Abuse Prevention, Rate Limiting & Input Sanitization', () => {
    it('prevents client-side badge self-granting with fake mockVerifiedEvents', async () => {
      const signedToken = signSessionToken(citizenSession);
      const req = new NextRequest('http://localhost:3000/api/badges/evaluate', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${signedToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: citizenSession.userId,
          mockVerifiedEvents: [
            {
              eventId: 'fake_123',
              userId: citizenSession.userId,
              eventType: 'VERIFIED_INCIDENT_REPORT',
              verifiedByActorId: 'fake_verifier',
            },
          ],
        }),
      });

      const res = await evaluateBadgesApi(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('SECURITY_VIOLATION');
    });

    it('sanitizes XSS scripts and HTML tags from input fields', () => {
      const maliciousInput = '<script>alert("XSS Attack")</script><b>Dangerous Incident</b>';
      const cleanText = sanitizeHtmlText(maliciousInput);
      expect(cleanText).not.toContain('<script>');
      expect(cleanText).toBe('Dangerous Incident');
    });

    it('enforces rate limiting on rapid repeated requests', () => {
      const clientIp = '192.168.1.100';
      const config = { windowMs: 10000, maxRequests: 3 };

      expect(checkRateLimit(clientIp, config).allowed).toBe(true);
      expect(checkRateLimit(clientIp, config).allowed).toBe(true);
      expect(checkRateLimit(clientIp, config).allowed).toBe(true);
      expect(checkRateLimit(clientIp, config).allowed).toBe(false); // 4th request blocked
    });
  });
});
