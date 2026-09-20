import {
  AppNotification,
  NotificationPreferences,
  NotificationProvider,
  NotificationProviderResult,
} from '../types';

export class MockPushNotificationProvider implements NotificationProvider {
  public readonly providerId = 'provider_fcm_push_mock';
  public readonly channelType = 'PUSH' as const;

  public async sendNotification(
    notification: AppNotification,
    preferences: NotificationPreferences
  ): Promise<NotificationProviderResult> {
    if (!preferences.channels.pushEnabled) {
      return {
        success: false,
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        error: 'PUSH channel disabled in preferences.',
      };
    }

    return {
      success: true,
      providerId: this.providerId,
      channel: this.channelType,
      notificationId: notification.id,
      deliveredAt: Date.now(),
    };
  }
}

export class MockEmailNotificationProvider implements NotificationProvider {
  public readonly providerId = 'provider_email_mock';
  public readonly channelType = 'EMAIL' as const;

  public async sendNotification(
    notification: AppNotification,
    preferences: NotificationPreferences
  ): Promise<NotificationProviderResult> {
    if (!preferences.channels.emailEnabled) {
      return {
        success: false,
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        error: 'EMAIL channel disabled in preferences.',
      };
    }

    return {
      success: true,
      providerId: this.providerId,
      channel: this.channelType,
      notificationId: notification.id,
      deliveredAt: Date.now(),
    };
  }
}

export class MockSmsNotificationProvider implements NotificationProvider {
  public readonly providerId = 'provider_sms_mock';
  public readonly channelType = 'SMS' as const;

  public async sendNotification(
    notification: AppNotification,
    preferences: NotificationPreferences
  ): Promise<NotificationProviderResult> {
    if (!preferences.channels.smsEnabled) {
      return {
        success: false,
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        error: 'SMS channel disabled in preferences.',
      };
    }

    return {
      success: true,
      providerId: this.providerId,
      channel: this.channelType,
      notificationId: notification.id,
      deliveredAt: Date.now(),
    };
  }
}
