import { describe, it, expect, vi } from 'vitest';
import { PRE_SEEDED_TIPS } from '../src/lib/education/tipsData';
import { ALL_BADGE_DEFINITIONS } from '../src/lib/badges/definitions';
import { BadgeService } from '../src/lib/badges/service';
import { UserSession } from '../src/lib/auth';
import { VerifiedUserEvent } from '../src/lib/education/types';

vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: {},
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn().mockResolvedValue({
    exists: () => false,
    val: () => null,
  }),
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
}));

describe('Antijj Educational Content & Tips Suite', () => {
  it('pre-seeds articles covering all 8 required safety & jungle justice prevention topics', () => {
    const categories = PRE_SEEDED_TIPS.map((t) => t.category);
    expect(categories).toContain('SAFE_REPORTING');
    expect(categories).toContain('PERSONAL_SAFETY');
    expect(categories).toContain('DE_ESCALATION');
    expect(categories).toContain('INVITING_MEMBERS');
    expect(categories).toContain('COMMUNITY_PARTICIPATION');
    expect(categories).toContain('CAMPAIGN_ORGANIZATION');
    expect(categories).toContain('PREVENTING_JUNGLE_JUSTICE');
    expect(categories).toContain('JUNGLE_JUSTICE_CONSEQUENCES');
  });

  it('ensures every educational tip contains markdown content, tags, author, and estimated read time', () => {
    PRE_SEEDED_TIPS.forEach((tip) => {
      expect(tip.id).toBeTruthy();
      expect(tip.title).toBeTruthy();
      expect(tip.summary.length).toBeGreaterThan(10);
      expect(tip.content.length).toBeGreaterThan(30);
      expect(tip.tags.length).toBeGreaterThan(0);
      expect(tip.author).toBeTruthy();
      expect(tip.estimatedReadMinutes).toBeGreaterThan(0);
    });
  });
});

describe('Antijj Badge Definitions Suite', () => {
  it('defines all required Tier (Bronze, Silver, Gold) and Specialized Badges', () => {
    const ids = ALL_BADGE_DEFINITIONS.map((b) => b.id);
    expect(ids).toContain('badge_tier_bronze');
    expect(ids).toContain('badge_tier_silver');
    expect(ids).toContain('badge_tier_gold');
    expect(ids).toContain('badge_spec_guardian');
    expect(ids).toContain('badge_spec_early_warning');
    expect(ids).toContain('badge_spec_builder');
    expect(ids).toContain('badge_spec_campaign_leader');
    expect(ids).toContain('badge_spec_life_saver');
  });

  it('validates each badge definition has criteria explanations and non-zero required event counts', () => {
    ALL_BADGE_DEFINITIONS.forEach((b) => {
      expect(b.name).toBeTruthy();
      expect(b.criteriaExplanation).toBeTruthy();
      expect(b.requiredVerifiedEventsCount).toBeGreaterThan(0);
      expect(b.badgeGradient).toContain('from-');
    });
  });
});

describe('Antijj Badge Service & Verification Engine Suite', () => {
  const mockSession: UserSession = {
    userId: 'user_test_citizen',
    role: 'CITIZEN_MEMBER',
    isAuthenticated: true,
    communityId: 'comm_central',
  };

  it('does NOT award badges for raw report submissions without verifier confirmation', async () => {
    const badgeService = BadgeService.getInstance();

    // User has unverified reports (verifiedByActorId === userId or missing)
    const unverifiedEvents: VerifiedUserEvent[] = [
      {
        eventId: 'ev_unverified_1',
        userId: 'user_test_citizen',
        eventType: 'VERIFIED_INCIDENT_REPORT',
        referenceId: 'inc_raw_1',
        timestamp: Date.now(),
        verifiedByActorId: 'user_test_citizen', // Self-reported, not verified by third-party leader
      },
    ];

    const result = await badgeService.evaluateUserBadges(
      mockSession,
      'user_test_citizen',
      unverifiedEvents
    );

    expect(result.newlyAwardedBadges.length).toBe(0);
  });

  it('awards Community Guardian badge when 3+ third-party verified incident reports are confirmed', async () => {
    const badgeService = BadgeService.getInstance();

    const verifiedEvents: VerifiedUserEvent[] = [
      {
        eventId: 'vev_1',
        userId: 'user_guardian_candidate',
        eventType: 'VERIFIED_INCIDENT_REPORT',
        referenceId: 'inc_101',
        timestamp: Date.now() - 1000 * 60 * 60,
        verifiedByActorId: 'leader_verifier_01',
      },
      {
        eventId: 'vev_2',
        userId: 'user_guardian_candidate',
        eventType: 'VERIFIED_INCIDENT_REPORT',
        referenceId: 'inc_102',
        timestamp: Date.now() - 1000 * 60 * 30,
        verifiedByActorId: 'authority_dispatcher_01',
      },
      {
        eventId: 'vev_3',
        userId: 'user_guardian_candidate',
        eventType: 'VERIFIED_INCIDENT_REPORT',
        referenceId: 'inc_103',
        timestamp: Date.now() - 1000 * 60 * 10,
        verifiedByActorId: 'leader_verifier_02',
      },
    ];

    const result = await badgeService.evaluateUserBadges(
      mockSession,
      'user_guardian_candidate',
      verifiedEvents
    );

    const awardedNames = result.allCurrentBadges.map((b) => b.badgeId);
    expect(awardedNames).toContain('badge_spec_guardian');
    expect(awardedNames).toContain('badge_tier_bronze'); // Earned 3 verified events >= 2
  });

  it('awards Campaign Leader badge when a campaign organization is completed and verified', async () => {
    const badgeService = BadgeService.getInstance();

    const verifiedEvents: VerifiedUserEvent[] = [
      {
        eventId: 'vev_camp_1',
        userId: 'user_campaign_organizer',
        eventType: 'CAMPAIGN_ORGANIZED_COMPLETED',
        referenceId: 'camp_101',
        timestamp: Date.now(),
        verifiedByActorId: 'system_admin_verifier',
      },
    ];

    const result = await badgeService.evaluateUserBadges(
      mockSession,
      'user_campaign_organizer',
      verifiedEvents
    );

    const awardedNames = result.allCurrentBadges.map((b) => b.badgeId);
    expect(awardedNames).toContain('badge_spec_campaign_leader');
  });

  it('generates SHA-256 payload hashes for badge audit logs', async () => {
    const badgeService = BadgeService.getInstance();

    const verifiedEvents: VerifiedUserEvent[] = [
      {
        eventId: 'vev_hazard_1',
        userId: 'user_life_saver',
        eventType: 'HAZARD_PREVENTION_CONFIRMED',
        referenceId: 'inc_hazard_99',
        timestamp: Date.now(),
        verifiedByActorId: 'authority_dispatcher_99',
      },
    ];

    const result = await badgeService.evaluateUserBadges(
      mockSession,
      'user_life_saver',
      verifiedEvents
    );

    const lifeSaverAward = result.allCurrentBadges.find((b) => b.badgeId === 'badge_spec_life_saver');
    expect(lifeSaverAward).toBeDefined();
    expect(lifeSaverAward?.payloadHash).toHaveLength(64); // Valid SHA-256 hex string
  });
});
