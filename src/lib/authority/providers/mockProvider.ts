import {
  AuthorityNotificationProvider,
  AuthorityPayload,
  AuthorityDestination,
  NotificationResult,
  AuthorityChannel,
} from '../types';

export class MockAuthorityProvider implements AuthorityNotificationProvider {
  readonly providerId = 'mock_authority_provider';
  readonly channel: AuthorityChannel = 'MOCK';

  private mockStore: Map<string, NotificationResult> = new Map();
  private simulateFailure: boolean;

  constructor(options?: { simulateFailure?: boolean }) {
    this.simulateFailure = options?.simulateFailure || false;
  }

  async sendNotification(
    payload: AuthorityPayload,
    destination: AuthorityDestination
  ): Promise<NotificationResult> {
    const now = Date.now();

    if (this.simulateFailure) {
      const failedResult: NotificationResult = {
        success: false,
        notificationId: payload.notificationId,
        status: 'FAILED',
        providerId: this.providerId,
        message: `Mock delivery failed to authority endpoint ${destination.endpoint}`,
        error: 'MOCK_DISPATCH_TIMEOUT: Endpoint unreachable in synthetic mode.',
      };
      this.mockStore.set(payload.notificationId, failedResult);
      return failedResult;
    }

    const deliveredResult: NotificationResult = {
      success: true,
      notificationId: payload.notificationId,
      status: 'DELIVERED',
      providerId: this.providerId,
      message: `Confirmed delivery to ${destination.name} (${destination.authorityId})`,
      deliveredAt: now,
    };

    this.mockStore.set(payload.notificationId, deliveredResult);
    return deliveredResult;
  }

  async checkNotificationStatus(notificationId: string): Promise<NotificationResult> {
    const existing = this.mockStore.get(notificationId);
    if (existing) {
      return existing;
    }
    return {
      success: false,
      notificationId,
      status: 'PENDING',
      providerId: this.providerId,
      message: 'Notification record pending in provider pipeline.',
    };
  }

  async acknowledgeNotification(notificationId: string, actorId: string): Promise<NotificationResult> {
    const existing = this.mockStore.get(notificationId);
    const now = Date.now();

    const ackResult: NotificationResult = {
      success: true,
      notificationId,
      status: 'ACKNOWLEDGED',
      providerId: this.providerId,
      message: `Escalation acknowledged by authority actor ${actorId}`,
      deliveredAt: existing?.deliveredAt || now - 1000,
      acknowledgedAt: now,
    };

    this.mockStore.set(notificationId, ackResult);
    return ackResult;
  }
}
