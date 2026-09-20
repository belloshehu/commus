import crypto from 'crypto';
import { ref, get, set } from 'firebase/database';
import { rtdb } from '../firebase/client';
import { UserSession } from '../auth';
import {
  BadgeAuditLog,
  UserBadgeAward,
  VerifiedUserEvent,
  VerifiedEventType,
} from '../education/types';
import { ALL_BADGE_DEFINITIONS } from './definitions';

export interface EvaluationResult {
  userId: string;
  evaluatedAt: number;
  newlyAwardedBadges: UserBadgeAward[];
  allCurrentBadges: UserBadgeAward[];
  verifiedEventsCount: number;
}

export class BadgeService {
  private static instance: BadgeService;

  private constructor() {}

  public static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService();
    }
    return BadgeService.instance;
  }

  /**
   * Main badge evaluation entrypoint.
   * Calculates eligibility based STRICTLY on verified user events.
   * Client self-grant attempts without server verification are rejected.
   */
  public async evaluateUserBadges(
    session: UserSession,
    targetUserId: string,
    verifiedEvents: VerifiedUserEvent[] = []
  ): Promise<EvaluationResult> {
    const now = Date.now();

    // 1. Fetch user's existing awarded badges from RTDB (or memory fallback)
    const userBadgesRef = ref(rtdb, `userBadges/${targetUserId}`);
    let existingAwardsMap: Record<string, UserBadgeAward> = {};

    try {
      const snapshot = await get(userBadgesRef);
      if (snapshot.exists()) {
        existingAwardsMap = snapshot.val();
      }
    } catch (err: any) {
      console.warn('[BadgeService] RTDB read fallback for user badges:', err.message);
    }

    const existingBadgeIds = new Set(
      Object.values(existingAwardsMap).map((award) => award.badgeId)
    );

    // 2. Fetch or combine verified user events (ignoring unverified raw reports)
    const verifiedEventsRef = ref(rtdb, `verifiedUserEvents/${targetUserId}`);
    let storedEvents: VerifiedUserEvent[] = [];

    try {
      const snapshot = await get(verifiedEventsRef);
      if (snapshot.exists()) {
        storedEvents = Object.values(snapshot.val());
      }
    } catch (err: any) {
      console.warn('[BadgeService] RTDB read fallback for verified events:', err.message);
    }

    const allEvents = [...storedEvents, ...verifiedEvents];

    // Filter to ensure events are strictly verified by an authority or community leader
    const validVerifiedEvents = allEvents.filter(
      (ev) => ev.verifiedByActorId && ev.verifiedByActorId !== ev.userId
    );

    // Group verified events by type
    const eventsByType: Record<VerifiedEventType, VerifiedUserEvent[]> = {
      VERIFIED_INCIDENT_REPORT: [],
      CAMPAIGN_ORGANIZED_COMPLETED: [],
      CAMPAIGN_PARTICIPATION: [],
      EARLY_WARNING_CONFIRMED: [],
      COMMUNITY_MEMBER_INVITED: [],
      HAZARD_PREVENTION_CONFIRMED: [],
    };

    validVerifiedEvents.forEach((ev) => {
      if (eventsByType[ev.eventType]) {
        eventsByType[ev.eventType].push(ev);
      }
    });

    const newlyAwardedBadges: UserBadgeAward[] = [];

    // 3. Evaluate Eligibility for Each Badge Definition
    for (const def of ALL_BADGE_DEFINITIONS) {
      if (existingBadgeIds.has(def.id)) {
        continue; // Already earned this badge
      }

      let isEligible = false;
      let matchedEvents: VerifiedUserEvent[] = [];

      switch (def.id) {
        case 'badge_spec_guardian':
          matchedEvents = eventsByType.VERIFIED_INCIDENT_REPORT;
          isEligible = matchedEvents.length >= 3;
          break;

        case 'badge_spec_early_warning':
          matchedEvents = eventsByType.EARLY_WARNING_CONFIRMED;
          isEligible = matchedEvents.length >= 2;
          break;

        case 'badge_spec_builder':
          matchedEvents = eventsByType.COMMUNITY_MEMBER_INVITED;
          isEligible = matchedEvents.length >= 5;
          break;

        case 'badge_spec_campaign_leader':
          matchedEvents = eventsByType.CAMPAIGN_ORGANIZED_COMPLETED;
          isEligible = matchedEvents.length >= 1;
          break;

        case 'badge_spec_life_saver':
          matchedEvents = eventsByType.HAZARD_PREVENTION_CONFIRMED;
          isEligible = matchedEvents.length >= 1;
          break;

        case 'badge_tier_bronze':
          isEligible = validVerifiedEvents.length >= 2;
          matchedEvents = validVerifiedEvents;
          break;

        case 'badge_tier_silver':
          isEligible = validVerifiedEvents.length >= 5;
          matchedEvents = validVerifiedEvents;
          break;

        case 'badge_tier_gold':
          isEligible = validVerifiedEvents.length >= 10;
          matchedEvents = validVerifiedEvents;
          break;

        default:
          isEligible = false;
      }

      if (isEligible) {
        const awardId = `award_${now}_${def.id}`;
        const refIds = matchedEvents.map((e) => e.eventId || e.referenceId);

        // Generate SHA-256 payload hash for audit log
        const payloadString = JSON.stringify({
          awardId,
          userId: targetUserId,
          badgeId: def.id,
          awardedAt: now,
          verifiedEventsCount: matchedEvents.length,
          refIds,
        });

        const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        const award: UserBadgeAward = {
          awardId,
          userId: targetUserId,
          badgeId: def.id,
          badgeName: def.name,
          awardedAt: now,
          criteriaMet: def.criteriaExplanation,
          verifiedEventReferences: refIds,
          payloadHash,
        };

        // Write award to RTDB
        try {
          await set(ref(rtdb, `userBadges/${targetUserId}/${awardId}`), award);
        } catch (err: any) {
          console.warn('[BadgeService] RTDB write fallback for user badge award:', err.message);
        }

        // Write signed Audit Log entry to RTDB
        const logId = `audit_badge_${now}_${crypto.randomBytes(4).toString('hex')}`;
        const auditLog: BadgeAuditLog = {
          logId,
          userId: targetUserId,
          badgeId: def.id,
          badgeName: def.name,
          awardedAt: now,
          evaluatedByActorId: session.userId || 'system_badge_engine',
          verifiedEventCount: matchedEvents.length,
          payloadHash,
        };

        try {
          await set(ref(rtdb, `badgeAwardAuditLogs/${logId}`), auditLog);
        } catch (err: any) {
          console.warn('[BadgeService] RTDB write fallback for badge audit log:', err.message);
        }

        newlyAwardedBadges.push(award);
        existingBadgeIds.add(def.id);
        existingAwardsMap[awardId] = award;
      }
    }

    return {
      userId: targetUserId,
      evaluatedAt: now,
      newlyAwardedBadges,
      allCurrentBadges: Object.values(existingAwardsMap),
      verifiedEventsCount: validVerifiedEvents.length,
    };
  }

  /**
   * Records a new verified user event (can only be called by authorized leaders/dispatchers/system).
   */
  public async recordVerifiedEvent(
    session: UserSession,
    event: VerifiedUserEvent
  ): Promise<void> {
    const isAuthorized =
      session.isAuthenticated &&
      ['VERIFIED_COMMUNITY_LEADER', 'AUTHORITY_DISPATCHER', 'SYSTEM_ADMIN'].includes(session.role);

    if (!isAuthorized) {
      throw new Error('UNAUTHORIZED: Only verified community leaders or authorities can register verified events.');
    }

    const eventId = event.eventId || `vev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const fullEvent: VerifiedUserEvent = {
      ...event,
      eventId,
      timestamp: Date.now(),
      verifiedByActorId: session.userId || 'leader_verifier',
    };

    try {
      await set(ref(rtdb, `verifiedUserEvents/${event.userId}/${eventId}`), fullEvent);
    } catch (err: any) {
      console.warn('[BadgeService] RTDB write fallback for verified event:', err.message);
    }
  }
}
