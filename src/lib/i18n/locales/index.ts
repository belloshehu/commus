import { SupportedLocale, LocaleMetadata, TranslationSchema } from '../types';
import { en } from './en';
import { ar } from './ar';
import { fr } from './fr';
import { ha } from './ha';
import { yo } from './yo';
import { pcm } from './pcm';
import { sw } from './sw';
import { ig } from './ig';

export const LOCALES_METADATA: Record<SupportedLocale, LocaleMetadata> = {
  en: { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', flagEmoji: '🇬🇧' },
  ar: { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', flagEmoji: '🇸🇦' },
  fr: { code: 'fr', nativeName: 'Français', englishName: 'French', dir: 'ltr', flagEmoji: '🇫🇷' },
  ha: { code: 'ha', nativeName: 'Harshen Hausa', englishName: 'Hausa', dir: 'ltr', flagEmoji: '🇳🇬' },
  yo: { code: 'yo', nativeName: 'Èdè Yorùbá', englishName: 'Yoruba', dir: 'ltr', flagEmoji: '🇳🇬' },
  pcm: { code: 'pcm', nativeName: 'Naija Pidgin', englishName: 'Nigerian Pidgin', dir: 'ltr', flagEmoji: '🇳🇬' },
  sw: { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili', dir: 'ltr', flagEmoji: '🇰🇪' },
  ig: { code: 'ig', nativeName: 'Asụsụ Igbo', englishName: 'Igbo', dir: 'ltr', flagEmoji: '🇳🇬' },
};

export const DICTIONARIES: Record<SupportedLocale, TranslationSchema> = {
  en,
  ar,
  fr,
  ha,
  yo,
  pcm,
  sw,
  ig,
};
