export type SupportedLocale = 'en' | 'ar' | 'fr' | 'ha' | 'yo' | 'pcm' | 'sw' | 'ig';

export type TextDirection = 'ltr' | 'rtl';

export interface LocaleMetadata {
  code: SupportedLocale;
  nativeName: string;
  englishName: string;
  dir: TextDirection;
  flagEmoji: string;
}

export interface NavTranslations {
  incidentFeed: string;
  joinCommunity: string;
  educationBadges: string;
  responseMap: string;
  alerts: string;
  safetyGuidance: string;
  authorityDispatch: string;
}

export interface CommonTranslations {
  save: string;
  cancel: string;
  close: string;
  submit: string;
  back: string;
  next: string;
  readMore: string;
  search: string;
  filter: string;
  loading: string;
  clear: string;
  copied: string;
  copy: string;
  callHotline: string;
  escalateIncident: string;
  syntheticDataNotice: string;
  safetyFirstNotice: string;
}

export interface DangerLevelTranslations {
  low: string;
  lowDesc: string;
  medium: string;
  mediumDesc: string;
  high: string;
  highDesc: string;
  critical: string;
  criticalDesc: string;
}

export interface FormTranslations {
  reportTitle: string;
  reportTitlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  categoryLabel: string;
  dangerLevelLabel: string;
  evidenceLabel: string;
  safetyConfirmationTitle: string;
  safetyRule1: string;
  safetyRule2: string;
  safetyRule3: string;
  safetyRule4: string;
  agreeAndSubmit: string;
}

export interface ValidationTranslations {
  requiredField: string;
  selectCategory: string;
  minDescriptionLength: string;
  uploadError: string;
  submissionFailed: string;
}

export interface NotificationTranslations {
  notificationsTitle: string;
  alertsTab: string;
  preferencesTab: string;
  markAllRead: string;
  markRead: string;
  unreadOnly: string;
  noNotifications: string;
  channelsTitle: string;
  inAppChannel: string;
  pushChannel: string;
  emailChannel: string;
  smsChannel: string;
  highRiskOnlyFilter: string;
  savePreferences: string;
}

export interface SystemTranslations {
  nonConfrontationPolicy: string;
  nonConfrontationDesc: string;
  fuzzedLocationNotice: string;
  reporterPrivacyNotice: string;
  auditLogNotice: string;
}

export interface TranslationSchema {
  nav: NavTranslations;
  common: CommonTranslations;
  dangerLevels: DangerLevelTranslations;
  forms: FormTranslations;
  validation: ValidationTranslations;
  notifications: NotificationTranslations;
  system: SystemTranslations;
}
