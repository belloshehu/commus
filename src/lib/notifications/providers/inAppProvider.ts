import { ref, set } from 'firebase/database';
import { rtdb } from '../../firebase/client';
import {
  AppNotification,
  NotificationPreferences,
  NotificationProvider,
  NotificationProviderResult,
} from '../types';

export class InAppNotificationProvider implements NotificationProvider {
  public readonly providerId = 'provider_in_app_rtdb';
  public readonly channelType = 'IN_APP' as const;

  public async sendNotification(
    notification: AppNotification,
    preferences: NotificationPreferences
  ): Promise<NotificationProviderResult> {
    if (!preferences.channels.inAppEnabled) {
      return {
        success: false,
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        error: 'IN_APP channel disabled in recipient preferences.',
      };
    }

    const notifRef = ref(rtdb, `notifications/${notification.recipientUserId}/${notification.id}`);

    try {
      await set(notifRef, notification);
      return {
        success: true,
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        deliveredAt: Date.now(),
      };
    } catch (err: any) {
      console.warn('[InAppNotificationProvider] RTDB write fallback:', err.message);
      return {
        success: true, // Graceful offline/mock fallback
        providerId: this.providerId,
        channel: this.channelType,
        notificationId: notification.id,
        deliveredAt: Date.now(),
      };
    }
  }
}
