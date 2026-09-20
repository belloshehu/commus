export type EducationalTipCategory =
  | 'SAFE_REPORTING'
  | 'PERSONAL_SAFETY'
  | 'DE_ESCALATION'
  | 'INVITING_MEMBERS'
  | 'COMMUNITY_PARTICIPATION'
  | 'CAMPAIGN_ORGANIZATION'
  | 'PREVENTING_JUNGLE_JUSTICE'
  | 'JUNGLE_JUSTICE_CONSEQUENCES';

export interface EducationalTip {
  id: string;
  title: string;
  category: EducationalTipCategory;
  categoryLabel: string;
  summary: string;
  content: string;
  tags: string[];
  author: string;
  estimatedReadMinutes: number;
  updatedAt: number;
  isPublished: boolean;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CampaignMetrics {
  reachCount: number;
  verifiedActionsCount: number;
  participantCount: number;
}

export interface CommunityCampaign {
  id: string;
  title: string;
  description: string;
  communityId: string;
  communityName: string;
  organizerId: string;
  organizerLabel: string;
  startDate: number;
  endDate: number;
  status: CampaignStatus;
  participantIds: string[];
  metrics: CampaignMetrics;
  createdAt: number;
  updatedAt: number;
}

export type BadgeCategory = 'TIER' | 'SPECIALIZED';
export type BadgeLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'SPECIALIST';

export type SpecialBadgeType =
  | 'COMMUNITY_GUARDIAN'
  | 'EARLY_WARNING'
  | 'COMMUNITY_BUILDER'
  | 'CAMPAIGN_LEADER'
  | 'LIFE_SAVER';

export interface BadgeDefinition {
  id: string;
  name: string;
  category: BadgeCategory;
  level: BadgeLevel;
  description: string;
  iconName: 'shield-check' | 'alert-triangle' | 'users' | 'megaphone' | 'heart-handshake' | 'award' | 'star' | 'crown';
  criteriaExplanation: string;
  requiredVerifiedEventsCount: number;
  badgeGradient: string;
  borderColor: string;
}

export interface UserBadgeAward {
  awardId: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  awardedAt: number;
  criteriaMet: string;
  verifiedEventReferences: string[];
  payloadHash: string;
}

export interface BadgeAuditLog {
  logId: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  awardedAt: number;
  evaluatedByActorId: string;
  verifiedEventCount: number;
  payloadHash: string;
}

export type VerifiedEventType =
  | 'VERIFIED_INCIDENT_REPORT'
  | 'CAMPAIGN_ORGANIZED_COMPLETED'
  | 'CAMPAIGN_PARTICIPATION'
  | 'EARLY_WARNING_CONFIRMED'
  | 'COMMUNITY_MEMBER_INVITED'
  | 'HAZARD_PREVENTION_CONFIRMED';

export interface VerifiedUserEvent {
  eventId: string;
  userId: string;
  eventType: VerifiedEventType;
  referenceId: string;
  timestamp: number;
  verifiedByActorId: string;
}
