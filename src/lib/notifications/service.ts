import { ref, get, set, update } from 'firebase/database';
import { rtdb } from '../firebase/client';
import { UserSession } from '../auth';
import {
  AppNotification,
  NotificationEventType,
  NotificationPreferences,
  NotificationProvider,
  NotificationProviderResult,
} from './types';
import { InAppNotificationProvider } from './providers/inAppProvider';
import {
  MockPushNotificationProvider,
  MockEmailNotificationProvider,
  MockSmsNotificationProvider,
} from './providers/mockProviders';

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  userId: '',
  channels: {
    inAppEnabled: true,
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
  },
  eventTypes: {
    newIncidentEnabled: true,
    highRiskOnly: false,
    membershipApprovedEnabled: true,
    campaignInvitationEnabled: true,
    badgeEarnedEnabled: true,
    authorityResponseEnabled: true,
    statusUpdateEnabled: true,
  },
  updatedAt: Date.now(),
};

export interface DispatchResult {
  notificationId: string;
  recipientUserId: string;
  suppressed: boolean;
  suppressionReason?: string;
  providerResults: NotificationProviderResult[];
}

export class NotificationService {
  private static instance: NotificationService;
  private providers: Map<string, NotificationProvider> = new Map();
  private dedupMemoryCache: Map<string, number> = new Map();
  private preferencesMemoryCache: Map<string, NotificationPreferences> = new Map();

  private constructor() {
    this.registerProvider(new InAppNotificationProvider());
    this.registerProvider(new MockPushNotificationProvider());
    this.registerProvider(new MockEmailNotificationProvider());
    this.registerProvider(new MockSmsNotificationProvider());
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public registerProvider(provider: NotificationProvider) {
    this.providers.set(provider.providerId, provider);
  }

  /**
   * Fetches user preferences from memory cache / RTDB or returns defaults.
   */
  public async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    if (this.preferencesMemoryCache.has(userId)) {
      return this.preferencesMemoryCache.get(userId)!;
    }

    const prefRef = ref(rtdb, `notificationPreferences/${userId}`);
    try {
      const snapshot = await get(prefRef);
      if (snapshot.exists()) {
        const val = snapshot.val() as NotificationPreferences;
        this.preferencesMemoryCache.set(userId, val);
        return val;
      }
    } catch (err: any) {
      console.warn('[NotificationService] Preferences read fallback:', err.message);
    }

    return { ...DEFAULT_PREFERENCES, userId };
  }

  /**
   * Updates user preferences in memory cache & RTDB.
   */
  public async updateUserPreferences(
    session: UserSession,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    if (!session.isAuthenticated || (session.userId !== preferences.userId && session.role !== 'SYSTEM_ADMIN')) {
      throw new Error('UNAUTHORIZED: Users can only update their own notification preferences.');
    }

    const updated = {
      ...preferences,
      updatedAt: Date.now(),
    };

    this.preferencesMemoryCache.set(preferences.userId, updated);

    const prefRef = ref(rtdb, `notificationPreferences/${preferences.userId}`);
    try {
      await set(prefRef, updated);
    } catch (err: any) {
      console.warn('[NotificationService] Preferences write fallback:', err.message);
    }

    return updated;
  }

  /**
   * Core Event Notification Dispatch Engine with Anti-Spam Deduplication.
   */
  public async dispatchEventNotification(
    params: {
      recipientUserId: string;
      eventType: NotificationEventType;
      title: string;
      message: string;
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      referenceId: string;
      communityId?: string;
      actionUrl?: string;
      safetyDisclaimer?: string;
    }
  ): Promise<DispatchResult> {
    const riskLevel = params.riskLevel || 'LOW';
    const now = Date.now();
    const notifId = `notif_${now}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Fetch recipient preferences
    const preferences = await this.getUserPreferences(params.recipientUserId);

    // 2. Event Type Preference Check
    if (preferences.eventTypes.highRiskOnly && riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') {
      return {
        notificationId: notifId,
        recipientUserId: params.recipientUserId,
        suppressed: true,
        suppressionReason: 'SUPPRESSED_HIGH_RISK_ONLY_PREFERENCE',
        providerResults: [],
      };
    }

    const isEventEnabled = this.isEventTypeEnabled(params.eventType, preferences.eventTypes);
    if (!isEventEnabled) {
      return {
        notificationId: notifId,
        recipientUserId: params.recipientUserId,
        suppressed: true,
        suppressionReason: `SUPPRESSED_EVENT_TYPE_${params.eventType}_DISABLED`,
        providerResults: [],
      };
    }

    // 3. Anti-Spam Deduplication Engine
    const deduplicationKey = `${params.recipientUserId}_${params.eventType}_${params.referenceId}_${riskLevel}`;
    const COOLDOWN_MS = 1000 * 60 * 60; // 1 hour cooldown for duplicate alerts without status change

    const lastSentTimestamp = this.dedupMemoryCache.get(deduplicationKey);
    if (lastSentTimestamp && now - lastSentTimestamp < COOLDOWN_MS) {
      return {
        notificationId: notifId,
        recipientUserId: params.recipientUserId,
        suppressed: true,
        suppressionReason: 'SUPPRESSED_DUPLICATE_HIGH_RISK_ALERT',
        providerResults: [],
      };
    }

    // Update memory cache
    this.dedupMemoryCache.set(deduplicationKey, now);

    // 4. Construct Notification Object
    const notification: AppNotification = {
      id: notifId,
      recipientUserId: params.recipientUserId,
      eventType: params.eventType,
      title: params.title,
      message: params.message,
      riskLevel,
      referenceId: params.referenceId,
      communityId: params.communityId,
      timestamp: now,
      isRead: false,
      deduplicationKey,
      actionUrl: params.actionUrl,
      safetyDisclaimer: params.safetyDisclaimer || (riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'SAFETY FIRST: Do NOT approach active hazards. Seek immediate shelter.' : undefined),
    };

    // 5. Dispatch across enabled Providers
    const providerResults: NotificationProviderResult[] = [];
    for (const provider of this.providers.values()) {
      const res = await provider.sendNotification(notification, preferences);
      providerResults.push(res);
    }

    return {
      notificationId: notifId,
      recipientUserId: params.recipientUserId,
      suppressed: false,
      providerResults,
    };
  }

  /**
   * User Notification Query with RBAC Isolation.
   */
  public async getUserNotifications(
    session: UserSession,
    targetUserId: string
  ): Promise<AppNotification[]> {
    if (!session.isAuthenticated || (session.userId !== targetUserId && session.role !== 'SYSTEM_ADMIN')) {
      throw new Error('UNAUTHORIZED: Users are restricted from querying notifications belonging to other members.');
    }

    const notifRef = ref(rtdb, `notifications/${targetUserId}`);
    try {
      const snapshot = await get(notifRef);
      if (snapshot.exists()) {
        const notifsMap = snapshot.val();
        const list = Object.values(notifsMap) as AppNotification[];
        return list.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (err: any) {
      console.warn('[NotificationService] RTDB read fallback for user notifications:', err.message);
    }

    return [];
  }

  /**
   * Mark single notification as read.
   */
  public async markAsRead(
    session: UserSession,
    notificationId: string
  ): Promise<void> {
    if (!session.isAuthenticated || !session.userId) {
      throw new Error('UNAUTHORIZED: Must be logged in to update read state.');
    }

    const notifRef = ref(rtdb, `notifications/${session.userId}/${notificationId}`);
    try {
      await update(notifRef, {
        isRead: true,
        readAt: Date.now(),
      });
    } catch (err: any) {
      console.warn('[NotificationService] RTDB markAsRead fallback:', err.message);
    }
  }

  /**
   * Mark all notifications as read for current user.
   */
  public async markAllAsRead(session: UserSession): Promise<void> {
    if (!session.isAuthenticated || !session.userId) {
      throw new Error('UNAUTHORIZED: Must be logged in to update read state.');
    }

    const userNotifs = await this.getUserNotifications(session, session.userId);
    const now = Date.now();

    for (const notif of userNotifs) {
      if (!notif.isRead) {
        const notifRef = ref(rtdb, `notifications/${session.userId}/${notif.id}`);
        try {
          await update(notifRef, {
            isRead: true,
            readAt: now,
          });
        } catch (err: any) {}
      }
    }
  }

  private isEventTypeEnabled(
    eventType: NotificationEventType,
    prefs: NotificationPreferences['eventTypes']
  ): boolean {
    switch (eventType) {
      case 'NEW_INCIDENT':
        return prefs.newIncidentEnabled;
      case 'HIGH_RISK_ALERT':
        return true; // Always enabled unless highRiskOnly filter applies
      case 'MEMBERSHIP_APPROVED':
        return prefs.membershipApprovedEnabled;
      case 'CAMPAIGN_INVITATION':
        return prefs.campaignInvitationEnabled;
      case 'BADGE_EARNED':
        return prefs.badgeEarnedEnabled;
      case 'AUTHORITY_RESPONSE':
        return prefs.authorityResponseEnabled;
      case 'INCIDENT_STATUS_UPDATE':
        return prefs.statusUpdateEnabled;
      default:
        return true;
    }
  }
}
