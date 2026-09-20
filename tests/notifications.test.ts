import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../src/lib/notifications/service';
import { UserSession } from '../src/lib/auth';
import { NotificationPreferences } from '../src/lib/notifications/types';

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

describe('Antijj Notification System & Provider Abstraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const citizenSession: UserSession = {
    userId: 'user_target_1',
    role: 'CITIZEN_MEMBER',
    isAuthenticated: true,
  };

  const intruderSession: UserSession = {
    userId: 'user_intruder_99',
    role: 'CITIZEN_MEMBER',
    isAuthenticated: true,
  };

  it('dispatches notifications across enabled providers for supported event types', async () => {
    const service = NotificationService.getInstance();

    const result = await service.dispatchEventNotification({
      recipientUserId: 'user_target_1',
      eventType: 'NEW_INCIDENT',
      title: 'New Incident Reported in District',
      message: 'Debris reported on 5th Avenue.',
      riskLevel: 'MEDIUM',
      referenceId: 'inc_test_101',
      communityId: 'comm_central',
    });

    expect(result.suppressed).toBe(false);
    expect(result.providerResults.length).toBeGreaterThan(0);
    const inAppResult = result.providerResults.find((p) => p.channel === 'IN_APP');
    expect(inAppResult?.success).toBe(true);
  });

  it('enforces anti-spam deduplication for high-risk incident alerts', async () => {
    const service = NotificationService.getInstance();
    const incidentId = 'inc_dedup_test';

    // First high risk alert dispatch -> Should succeed
    const firstResult = await service.dispatchEventNotification({
      recipientUserId: 'user_target_1',
      eventType: 'HIGH_RISK_ALERT',
      title: 'HIGH-RISK ALERT: Crowd Gathering',
      message: 'Immediate safety hazard near East Gate.',
      riskLevel: 'HIGH',
      referenceId: incidentId,
    });

    expect(firstResult.suppressed).toBe(false);

    // Second duplicate high risk alert dispatch for same incident -> Should be suppressed
    const secondResult = await service.dispatchEventNotification({
      recipientUserId: 'user_target_1',
      eventType: 'HIGH_RISK_ALERT',
      title: 'HIGH-RISK ALERT: Crowd Gathering',
      message: 'Immediate safety hazard near East Gate.',
      riskLevel: 'HIGH',
      referenceId: incidentId,
    });

    expect(secondResult.suppressed).toBe(true);
    expect(secondResult.suppressionReason).toBe('SUPPRESSED_DUPLICATE_HIGH_RISK_ALERT');
  });

  it('filters notifications according to user preference highRiskOnly setting', async () => {
    const service = NotificationService.getInstance();

    // Mock highRiskOnly = true
    const customPrefs: NotificationPreferences = {
      userId: 'user_filtered_1',
      channels: { inAppEnabled: true, pushEnabled: true, emailEnabled: false, smsEnabled: false },
      eventTypes: {
        newIncidentEnabled: true,
        highRiskOnly: true, // Only HIGH or CRITICAL
        membershipApprovedEnabled: true,
        campaignInvitationEnabled: true,
        badgeEarnedEnabled: true,
        authorityResponseEnabled: true,
        statusUpdateEnabled: true,
      },
      updatedAt: Date.now(),
    };

    await service.updateUserPreferences(
      { userId: 'user_filtered_1', role: 'CITIZEN_MEMBER', isAuthenticated: true },
      customPrefs
    );

    // Dispatch LOW risk notification
    const lowRiskResult = await service.dispatchEventNotification({
      recipientUserId: 'user_filtered_1',
      eventType: 'NEW_INCIDENT',
      title: 'Minor Lighting Fault',
      message: 'Walkway light offline.',
      riskLevel: 'LOW',
      referenceId: 'inc_low_1',
    });

    expect(lowRiskResult.suppressed).toBe(true);
    expect(lowRiskResult.suppressionReason).toBe('SUPPRESSED_HIGH_RISK_ONLY_PREFERENCE');
  });

  it('rejects notification query attempts from unauthorized actors attempting to read another user notifications', async () => {
    const service = NotificationService.getInstance();

    await expect(
      service.getUserNotifications(intruderSession, 'user_target_1')
    ).rejects.toThrow(/Users are restricted from querying notifications belonging to other members/);
  });
});
