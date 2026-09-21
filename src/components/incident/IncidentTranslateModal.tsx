'use client';

import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import {
  Globe,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

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
  { id: 'portuguese', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { id: 'french', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { id: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { id: 'yoruba', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬', dir: 'ltr' },
  { id: 'hausa', name: 'Hausa', nativeName: 'Harshen Hausa', flag: '🇳🇬', dir: 'ltr' },
  { id: 'igbo', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', dir: 'ltr' },
];

export interface IncidentDataForTranslation {
  id?: string;
  title: string;
  description: string;
  category?: string;
  dangerLevel?: string;
  status?: string;
}

export interface IncidentTranslateModalProps {
  incident: IncidentDataForTranslation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentTranslateModal: React.FC<IncidentTranslateModalProps> = ({
  incident,
  isOpen,
  onClose,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageOption>(
    SUPPORTED_TRANSLATION_LANGUAGES[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    description: string;
    categoryLabel?: string;
    dangerLevelLabel?: string;
    statusLabel?: string;
    safetyNotice?: string;
    provider?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const { isSpeaking, isPaused, speak, pause, resume, stop } = useTextToSpeech({
    lang: selectedLang.id,
  });

  const handleTranslate = async (lang: SupportedLanguageOption) => {
    if (!incident) return;
    setSelectedLang(lang);
    setLoading(true);
    setError(null);
    stop();

    try {
      const res = await fetch('/api/ai/translate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident.id,
          title: incident.title,
          description: incident.description,
          category: incident.category,
          dangerLevel: incident.dangerLevel,
          status: incident.status,
          targetLanguage: lang.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to translate incident report');
      }

      setTranslatedData({
        title: data.translated.title,
        description: data.translated.description,
        categoryLabel: data.translated.categoryLabel,
        dangerLevelLabel: data.translated.dangerLevelLabel,
        statusLabel: data.translated.statusLabel,
        safetyNotice: data.translated.safetyNotice,
        provider: data.provider,
      });
    } catch (err: any) {
      console.error('Incident translation error:', err);
      setError(err.message || 'Translation service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incident && isOpen) {
      handleTranslate(selectedLang);
    } else {
      stop();
      setTranslatedData(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident, isOpen]);

  if (!isOpen || !incident) return null;

  const constructFullSpeechText = (): string => {
    if (!translatedData) return '';
    let text = `${translatedData.title}. `;
    if (translatedData.dangerLevelLabel) {
      text += `${translatedData.dangerLevelLabel}. `;
    }
    text += `${translatedData.description}. `;
    if (translatedData.safetyNotice) {
      text += `${translatedData.safetyNotice}`;
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
    const fullText = `[${selectedLang.name} Incident Report]\n\n${translatedData.title}\n\n${translatedData.description}\n\n${translatedData.safetyNotice ? `Precaution: ${translatedData.safetyNotice}\n` : ''}`;
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
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Multilingual Incident Report Translation</h3>
              <p className="text-xs text-slate-400">
                Powered by Gemini AI • 8 Languages with Voice Audio Playback
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stop();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Language Selection Pills */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-3">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Language for Translation & Voice:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {SUPPORTED_TRANSLATION_LANGUAGES.map((lang) => {
              const isSelected = selectedLang.id === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleTranslate(lang)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border border-cyan-400'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span>{lang.name}</span>
                  <span className="text-[10px] opacity-75">({lang.nativeName})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3 text-cyan-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Translating incident report into {selectedLang.name}...
              </p>
              <span className="text-xs text-slate-500">
                Preserving critical safety terminology and situational instructions
              </span>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => handleTranslate(selectedLang)}
                className="mt-2 text-xs font-semibold text-rose-400 underline hover:text-rose-300"
              >
                Try translating again
              </button>
            </div>
          ) : translatedData ? (
            <div
              className={`space-y-4 ${selectedLang.dir === 'rtl' ? 'text-right' : 'text-left'}`}
              dir={selectedLang.dir}
            >
              {/* Status / Category Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {translatedData.dangerLevelLabel && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {translatedData.dangerLevelLabel}
                  </span>
                )}
                {translatedData.categoryLabel && (
                  <span className="inline-flex items-center rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {translatedData.categoryLabel}
                  </span>
                )}
                {translatedData.provider === 'gemini' ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    AI Translated (Gemini)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
                    Local High-Precision Translation
                  </span>
                )}
              </div>

              {/* Translated Title */}
              <h2 className="text-xl font-bold text-white leading-tight">
                {translatedData.title}
              </h2>

              {/* Translated Description */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {translatedData.description}
              </div>

              {/* Precaution / Safety Notice */}
              {translatedData.safetyNotice && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Precautionary Safety Notice:</span>
                    <span>{translatedData.safetyNotice}</span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-4">
          {/* Text-to-Speech Play / Pause / Stop Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !translatedData}
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all disabled:opacity-50 ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold'
                  : 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-cyan-500/20'
              }`}
              title="Listen to this translated report aloud"
            >
              {isSpeaking ? (
                <>
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  <span>{isPaused ? 'Resume Voice' : 'Pause Voice'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Listen in {selectedLang.name}</span>
                </>
              )}
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
                title="Stop Audio"
              >
                <VolumeX className="h-4 w-4 text-rose-400" />
                <span>Stop</span>
              </button>
            )}

            {isSpeaking && !isPaused && (
              <div className="flex items-center gap-1 px-2 text-amber-400">
                <span className="h-2 w-0.5 animate-pulse bg-amber-400" />
                <span className="h-3 w-0.5 animate-pulse bg-amber-400 delay-75" />
                <span className="h-2 w-0.5 animate-pulse bg-amber-400 delay-150" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!translatedData}
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stop();
                onClose();
              }}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
