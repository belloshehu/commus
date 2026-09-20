'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLocale, LocaleMetadata, TextDirection } from './types';
import { LOCALES_METADATA, DICTIONARIES } from './locales';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  metadata: LocaleMetadata;
  dir: TextDirection;
  isRtl: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: LocaleMetadata[];
}

const STORAGE_KEY = 'antijj_preferred_locale';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode; initialLocale?: SupportedLocale }> = ({
  children,
  initialLocale = 'en',
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  // Load persisted locale preference from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale;
      if (saved && LOCALES_METADATA[saved]) {
        setLocaleState(saved);
      }
    } catch (e) {}
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    if (!LOCALES_METADATA[newLocale]) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (e) {}
  }, []);

  const metadata = LOCALES_METADATA[locale] || LOCALES_METADATA.en;
  const dir = metadata.dir;
  const isRtl = dir === 'rtl';

  // Synchronize document dir and lang attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = locale;
    }
  }, [dir, locale]);

  /**
   * Dot-notation translation resolution function with English fallback and parameter interpolation.
   */
  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const keys = keyPath.split('.');
      const activeDict = DICTIONARIES[locale] || DICTIONARIES.en;
      const fallbackDict = DICTIONARIES.en;

      let result: any = activeDict;
      let fallbackResult: any = fallbackDict;

      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          result = undefined;
        }

        if (fallbackResult && typeof fallbackResult === 'object' && k in fallbackResult) {
          fallbackResult = fallbackResult[k];
        } else {
          fallbackResult = undefined;
        }
      }

      let template = typeof result === 'string' ? result : typeof fallbackResult === 'string' ? fallbackResult : keyPath;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return template;
    },
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        metadata,
        dir,
        isRtl,
        t,
        availableLocales: Object.values(LOCALES_METADATA),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback safe context if component rendered outside I18nProvider
    return {
      locale: 'en' as SupportedLocale,
      setLocale: () => {},
      metadata: LOCALES_METADATA.en,
      dir: 'ltr' as TextDirection,
      isRtl: false,
      t: (key: string) => key,
      availableLocales: Object.values(LOCALES_METADATA),
    };
  }
  return context;
}
