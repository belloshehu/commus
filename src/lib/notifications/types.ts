export type NotificationEventType =
  | 'NEW_INCIDENT'
  | 'HIGH_RISK_ALERT'
  | 'MEMBERSHIP_APPROVED'
  | 'CAMPAIGN_INVITATION'
  | 'BADGE_EARNED'
  | 'AUTHORITY_RESPONSE'
  | 'INCIDENT_STATUS_UPDATE';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS';

export interface AppNotification {
  id: string;
  recipientUserId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  referenceId: string;
  communityId?: string;
  timestamp: number;
  isRead: boolean;
  readAt?: number;
  deduplicationKey: string;
  actionUrl?: string;
  safetyDisclaimer?: string;
}

export interface ChannelPreferences {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export interface EventTypePreferences {
  newIncidentEnabled: boolean;
  highRiskOnly: boolean;
  membershipApprovedEnabled: boolean;
  campaignInvitationEnabled: boolean;
  badgeEarnedEnabled: boolean;
  authorityResponseEnabled: boolean;
  statusUpdateEnabled: boolean;
}

export interface NotificationPreferences {
  userId: string;
  channels: ChannelPreferences;
  eventTypes: EventTypePreferences;
  updatedAt: number;
}

export interface NotificationProviderResult {
  success: boolean;
  providerId: string;
  channel: NotificationChannel;
  notificationId: string;
  deliveredAt?: number;
  error?: string;
}

export interface NotificationProvider {
  providerId: string;
  channelType: NotificationChannel;
  sendNotification(
    notification: AppNotification,
    preferences: NotificationPreferences
  ): Promise<NotificationProviderResult>;
}
