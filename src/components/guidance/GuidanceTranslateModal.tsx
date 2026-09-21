'use client';

import React, { useState, useEffect } from 'react';
import { SafetyGuide } from '@/lib/guidance/types';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export interface GuidanceTranslateModalProps {
  guide: SafetyGuide | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface SupportedLanguageOption {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_TRANSLATION_LANGUAGES: SupportedLanguageOption[] = [
  { id: 'english', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { id: 'arabic', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { id: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { id: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { id: 'hausa', name: 'Hausa', nativeName: 'Harshen Hausa', flag: '🇳🇬', dir: 'ltr' },
  { id: 'yoruba', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬', dir: 'ltr' },
  { id: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { id: 'igbo', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', dir: 'ltr' },
];

export const GuidanceTranslateModal: React.FC<GuidanceTranslateModalProps> = ({ guide, isOpen, onClose }) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageOption>(SUPPORTED_TRANSLATION_LANGUAGES[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    summary: string;
    description: string;
    doList: string[];
    dontList: string[];
    provider?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const { isSpeaking, isPaused, speak, pause, resume, stop } = useTextToSpeech({ lang: selectedLang.id });

  useEffect(() => {
    if (guide && isOpen) {
      handleTranslate(selectedLang);
    } else {
      stop();
      setTranslatedData(null);
      setError(null);
    }
  }, [guide, isOpen]);

  if (!isOpen || !guide) return null;

  const handleTranslate = async (lang: SupportedLanguageOption) => {
    setSelectedLang(lang);
    setLoading(true);
    setError(null);
    stop();

    try {
      const res = await fetch('/api/ai/translate-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: guide.id,
          title: guide.title,
          summary: guide.summary,
          description: guide.description,
          doList: guide.doList,
          dontList: guide.dontList,
          targetLanguage: lang.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate translation');
      }

      setTranslatedData({
        title: data.translated.title,
        summary: data.translated.summary,
        description: data.translated.description,
        doList: data.translated.doList || [],
        dontList: data.translated.dontList || [],
        provider: data.provider,
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const constructFullSpeechText = (): string => {
    if (!translatedData) return '';
    let text = `${translatedData.title}. ${translatedData.summary}. ${translatedData.description}.`;
    if (translatedData.doList.length > 0) {
      text += ` Recommended Actions: ${translatedData.doList.join('. ')}.`;
    }
    if (translatedData.dontList.length > 0) {
      text += ` Actions to Avoid: ${translatedData.dontList.join('. ')}.`;
    }
    return text;
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      const speechText = constructFullSpeechText();
      speak(speechText, selectedLang.id);
    }
  };

  const handleCopyText = () => {
    if (!translatedData) return;
    const fullText = `[${selectedLang.name} Translation]\n\n${translatedData.title}\n${translatedData.summary}\n\n${translatedData.description}\n\nDOs:\n${translatedData.doList.map((d) => `• ${d}`).join('\n')}\n\nDON'Ts:\n${translatedData.dontList.map((d) => `• ${d}`).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Gemini AI Safety Guide Translation</h3>
              <p className="text-xs text-slate-400">Translate guidance into 8 major languages with Text-to-Speech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Language Selector Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Target Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => {
                const isSelected = selectedLang.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleTranslate(lang)}
                    disabled={loading}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-sm'
                        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <div className="text-left truncate">
                      <div className="font-semibold leading-none">{lang.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-none">{lang.nativeName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <span className="text-xl">{selectedLang.flag}</span>
              </div>
              <p className="text-sm text-slate-300 font-medium animate-pulse">
                Translating guidance into {selectedLang.name} via Gemini AI...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300 flex items-center gap-3">
              <svg className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Translated Result Display */}
          {!loading && translatedData && (
            <div
              dir={selectedLang.dir}
              className={`space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5 ${
                selectedLang.dir === 'rtl' ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedLang.flag}</span>
                  <span className="text-xs font-semibold text-slate-300">{selectedLang.name} ({selectedLang.nativeName})</span>
                  {translatedData.provider && (
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                      {translatedData.provider === 'gemini' ? '✨ Gemini AI' : 'Multilingual Engine'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>

                  {/* Audio Play Button */}
                  <button
                    onClick={handleToggleSpeech}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isSpeaking
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    }`}
                  >
                    <span>{isSpeaking ? (isPaused ? '▶ Resume Voice' : '⏸ Pause Voice') : '🔊 Listen Voice'}</span>
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={stop}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-xs text-red-400 hover:bg-slate-700"
                      title="Stop Voice"
                    >
                      ⏹
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-lg font-bold text-white leading-snug">{translatedData.title}</h4>

              {/* Summary */}
              <p className="text-sm font-medium text-cyan-300/90 leading-relaxed bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/10">
                {translatedData.summary}
              </p>

              {/* Description */}
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {translatedData.description}
              </div>

              {/* Lists */}
              {translatedData.doList.length > 0 && (
                <div className="pt-2">
                  <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Recommended Actions</h5>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {translatedData.doList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {translatedData.dontList.length > 0 && (
                <div className="pt-2">
                  <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Actions to Avoid</h5>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {translatedData.dontList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-6 py-3 bg-slate-900/90">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
