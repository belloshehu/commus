export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'ACKNOWLEDGED';

export type AuthorityChannel = 'API' | 'SECURE_EMAIL' | 'SMS' | 'MOCK';

export type AuthorityType = 'POLICE' | 'TRAFFIC' | 'FIRE_RESCUE' | 'MUNICIPAL' | 'GENERAL_DISPATCH';

export interface AuthorityDestination {
  authorityId: string;
  name: string;
  type: AuthorityType;
  endpoint: string;
  geohashPrefix: string;
  channel: AuthorityChannel;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AuthorityPayloadEvidence {
  id: string;
  url: string;
  type: string;
  name: string;
}

export interface AuthorityPayload {
  notificationId: string;
  incidentId: string;
  category: string;
  title: string;
  description: string;
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
    geohash: string;
    isPreciseDecrypted?: boolean;
  };
  evidence: AuthorityPayloadEvidence[];
  timestamp: number;
  metadata: {
    reporterLabel: string;
    communityId: string;
  };
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  status: NotificationStatus;
  providerId: string;
  message: string;
  deliveredAt?: number;
  acknowledgedAt?: number;
  error?: string;
}

export interface DeliveryAttemptRecord {
  attemptNumber: number;
  timestamp: number;
  status: NotificationStatus;
  responseMessage?: string;
  error?: string;
}

export interface AuthorityEscalationRecord {
  escalationId: string;
  incidentId: string;
  authorityTarget: string;
  destination: AuthorityDestination;
  status: NotificationStatus;
  deliveryAttempts: DeliveryAttemptRecord[];
  retryCount: number;
  maxRetries: number;
  escalatedAt: number;
  lastAttemptAt: number;
  deliveredAt?: number;
  acknowledgedAt?: number;
  acknowledgedByActorId?: string;
  payloadHash: string;
}

export interface AuthorityNotificationProvider {
  readonly providerId: string;
  readonly channel: AuthorityChannel;
  sendNotification(payload: AuthorityPayload, destination: AuthorityDestination): Promise<NotificationResult>;
  checkNotificationStatus(notificationId: string): Promise<NotificationResult>;
  acknowledgeNotification(notificationId: string, actorId: string): Promise<NotificationResult>;
}
