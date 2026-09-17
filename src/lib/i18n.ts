export type Locale = 'en' | 'ar';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  safetyBannerTitle: string;
  safetyBannerText: string;
  submitIncident: string;
  loginToSubmit: string;
  anonymousWarning: string;
  communityIncidents: string;
  publicIncidents: string;
  escalateToAuthority: string;
  escalationAuditedNotice: string;
  locationBlurredNotice: string;
  roleCitizen: string;
  roleLeader: string;
  roleDispatcher: string;
}

export const translations: Record<Locale, TranslationDictionary> = {
  en: {
    appName: "Antijj",
    tagline: "Privacy-Preserving Community Safety Platform",
    safetyBannerTitle: "SAFETY FIRST: DO NOT CONFRONT CROWDS",
    safetyBannerText: "Never approach, photograph, or confront violent crowds or active hazard zones. Stay safe and seek immediate shelter.",
    submitIncident: "Report Safety Incident",
    loginToSubmit: "Sign in with a verified community account to submit reports.",
    anonymousWarning: "Anonymous users cannot submit incident reports to maintain community accountability.",
    communityIncidents: "Verified Community Incidents",
    publicIncidents: "Public Safety Bulletins",
    escalateToAuthority: "Escalate to Emergency Authorities",
    escalationAuditedNotice: "Escalation events generate an immutable, cryptographically hash-signed audit record.",
    locationBlurredNotice: "Location coordinates are fuzzed (~1.2km blur) to protect reporter privacy.",
    roleCitizen: "Citizen Member",
    roleLeader: "Community Leader",
    roleDispatcher: "Authority Dispatcher"
  },
  ar: {
    appName: "أنتيج",
    tagline: "منصة السلامة المجتمعية لحماية الخصوصية",
    safetyBannerTitle: "السلامة أولاً: لا تواجه الحشود",
    safetyBannerText: "لا تقترب أبداً من الحشود العنيفة أو مناطق الخطر النشطة ولا تلتقط لها صوراً. حافظ على سلامتك والتمس المأوى فوراً.",
    submitIncident: "الإبلاغ عن حادثة سلامة",
    loginToSubmit: "سجل الدخول بحساب مجتمعي موثق لتقديم التقارير.",
    anonymousWarning: "لا يمكن للمستخدمين مجهولي الهوية تقديم تقارير عن الحوادث لضمان المساءلة المجتمعية.",
    communityIncidents: "حوادث المجتمع الموثقة",
    publicIncidents: "نشرات السلامة العامة",
    escalateToAuthority: "تصعيد إلى سلطات الطوارئ",
    escalationAuditedNotice: "تنشئ عمليات التصعيد سجلاً مدققاً وموقعاً بتشفير لا يمكن تغييره.",
    locationBlurredNotice: "تم تمويه إحداثيات الموقع (~1.2 كم) لحماية خصوصية المبلغ.",
    roleCitizen: "عضو مجتمعي",
    roleLeader: "قائد مجتمعي",
    roleDispatcher: "موزع طوارئ"
  }
};

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getTranslation(locale: Locale, key: keyof TranslationDictionary): string {
  return translations[locale]?.[key] || translations['en'][key] || String(key);
}
