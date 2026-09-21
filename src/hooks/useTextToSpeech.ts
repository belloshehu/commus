'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentText('');
    }
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const speak = useCallback(
    (text: string, targetLang?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis is not supported in this browser environment.');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      if (!text || text.trim().length === 0) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const languageCode = getLanguageBcp47Code(targetLang || options.lang || 'en');
      utterance.lang = languageCode;
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setCurrentText(text);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
      };

      utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
        setCurrentText('');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [options.lang, options.rate, options.pitch]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    currentText,
    speak,
    pause,
    resume,
    stop,
  };
}

/**
 * Maps human-readable language names or codes to BCP 47 tags for SpeechSynthesis.
 */
function getLanguageBcp47Code(lang: string): string {
  const normalized = lang.toLowerCase().trim();
  const langMap: Record<string, string> = {
    english: 'en-US',
    en: 'en-US',
    arabic: 'ar-SA',
    ar: 'ar-SA',
    french: 'fr-FR',
    fr: 'fr-FR',
    portuguese: 'pt-PT',
    portegues: 'pt-PT',
    pt: 'pt-PT',
    hausa: 'ha-NG',
    ha: 'ha-NG',
    yoruba: 'yo-NG',
    yo: 'yo-NG',
    swahili: 'sw-KE',
    sw: 'sw-KE',
    igbo: 'ig-NG',
    ig: 'ig-NG',
  };

  return langMap[normalized] || 'en-US';
}
