'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from '@/lib/auth';
import { can } from '@/lib/authorization';
import { GUIDANCE_CATEGORIES, GuidanceCategory, SafetyGuide, UrgencyLevel } from '@/lib/guidance/types';
import { subscribeSafetyGuides } from '@/lib/guidance/service';
import { GuidanceMediaViewer } from './GuidanceMediaViewer';
import { CreateGuidanceModal } from './CreateGuidanceModal';
import {
  Shield,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Flame,
  Car,
  Wind,
  ShieldAlert,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  Radio,
  Volume2,
  VolumeX,
  Languages,
} from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { GuidanceTranslateModal } from './GuidanceTranslateModal';

interface SafetyGuidanceTabProps {
  userSession: UserSession | null;
}

export const SafetyGuidanceTab: React.FC<SafetyGuidanceTabProps> = ({ userSession }) => {
  const [guides, setGuides] = useState<SafetyGuide[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GuidanceCategory | 'all'>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuideIds, setExpandedGuideIds] = useState<Set<string>>(new Set());

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [translatingGuide, setTranslatingGuide] = useState<SafetyGuide | null>(null);
  const [speakingGuideId, setSpeakingGuideId] = useState<string | null>(null);

  const { isSpeaking, isPaused, speak, pause, resume, stop } = useTextToSpeech({ lang: 'en' });

  // Check if caller can post guidance (authority, admin, super_admin)
  const isAuthority = can(userSession, 'guidance:create');

  const handleToggleSpeech = (e: React.MouseEvent, guide: SafetyGuide) => {
    e.stopPropagation();
    if (speakingGuideId === guide.id && isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      setSpeakingGuideId(guide.id);
      let text = `${guide.title}. ${guide.summary}. ${guide.description}.`;
      if (guide.doList && guide.doList.length > 0) {
        text += ` Immediate actions: ${guide.doList.join('. ')}.`;
      }
      if (guide.dontList && guide.dontList.length > 0) {
        text += ` Prohibited actions: ${guide.dontList.join('. ')}.`;
      }
      speak(text);
    }
  };

  const handleOpenTranslateModal = (e: React.MouseEvent, guide: SafetyGuide) => {
    e.stopPropagation();
    setTranslatingGuide(guide);
  };

  useEffect(() => {
    const unsubscribe = subscribeSafetyGuides((updatedGuides) => {
      setGuides(updatedGuides);
      // Auto-expand first guide by default
      if (updatedGuides.length > 0 && expandedGuideIds.size === 0) {
        setExpandedGuideIds(new Set([updatedGuides[0].id]));
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedGuideIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedGuideIds(next);
  };

  // Category Icon Resolver
  const renderCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Car':
        return <Car className={className} />;
      case 'Wind':
        return <Wind className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'AlertTriangle':
        return <AlertTriangle className={className} />;
      default:
        return <Shield className={className} />;
    }
  };

  // Filter guides
  const filteredGuides = guides.filter((guide) => {
    if (selectedCategory !== 'all' && guide.category !== selectedCategory) {
      return false;
    }
    if (selectedUrgency !== 'all' && guide.urgencyLevel !== selectedUrgency) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = guide.title.toLowerCase().includes(q);
      const matchSummary = guide.summary.toLowerCase().includes(q);
      const matchDesc = guide.description.toLowerCase().includes(q);
      return matchTitle || matchSummary || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Authority Control Bar */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">Community Safety Guidance Library</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                  <Radio className="w-3 h-3 animate-pulse" /> Verified Protocols
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Official emergency procedures, hazard mitigation protocols, and safe response guidelines provided by verified authorities.
              </p>
            </div>
          </div>

          {/* Authority Creation Button (Only shown if authorized) */}
          {isAuthority && (
            <div className="shrink-0">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all border border-cyan-400/40"
              >
                <Plus className="w-4 h-4" />
                Publish Safety Guide (Authority)
              </button>
            </div>
          )}
        </div>

        {/* Non-Confrontation UX Guarantee */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong>Anti-Vigilantism</strong>: Zero public accusations.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span><strong>Audited Escalations</strong>: Directly dispatches emergency teams.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span><strong>Rich Media</strong>: Instructional photos, videos & audio alerts.</span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Filter Safety Guidance by Hazard Topic ({GUIDANCE_CATEGORIES.length} Categories)
        </label>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${selectedCategory === 'all'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            All Topics ({guides.length})
          </button>

          {GUIDANCE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = guides.filter((g) => g.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border ${isSelected
                    ? `${cat.badgeColor} bg-slate-900 shadow-md`
                    : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:border-slate-700 hover:text-slate-200'
                  }`}
              >
                {renderCategoryIcon(cat.iconName, 'w-3.5 h-3.5')}
                {cat.shortLabel}
                <span className="ml-0.5 rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Priority Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guidance by title, instructions, or emergency actions..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value as any)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 px-3 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Urgency Priorities</option>
            <option value="CRITICAL">Critical Priority Only</option>
            <option value="HIGH">High Priority Only</option>
            <option value="MEDIUM">Medium Priority Only</option>
            <option value="LOW">Low Priority Only</option>
          </select>
        </div>
      </div>

      {/* Guidance Cards List */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
            <ShieldAlert className="mx-auto w-12 h-12 text-slate-600 mb-3 animate-bounce" />
            <h3 className="text-sm font-bold text-slate-200">No Guidance Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No safety guides match the selected category or search query.
            </p>
          </div>
        ) : (
          filteredGuides.map((guide) => {
            const catMeta = GUIDANCE_CATEGORIES.find((c) => c.id === guide.category);
            const isExpanded = expandedGuideIds.has(guide.id);

            const urgencyBadge = {
              CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
              HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
              MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
              LOW: 'bg-slate-700/40 text-slate-300 border-slate-600',
            }[guide.urgencyLevel];

            return (
              <div
                key={guide.id}
                className={`rounded-2xl border ${catMeta ? catMeta.borderColor : 'border-slate-800'
                  } bg-slate-900/90 shadow-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/50`}
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(guide.id)}
                  className="p-4 md:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${catMeta?.accentBg || 'bg-slate-800'} text-white border border-slate-700`}>
                      {renderCategoryIcon(catMeta?.iconName || 'Shield', 'w-5 h-5 text-cyan-400')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${urgencyBadge}`}>
                          {guide.urgencyLevel} Priority
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${catMeta?.badgeColor || 'border-slate-700 text-slate-300'}`}>
                          {catMeta?.shortLabel || guide.category}
                        </span>
                        {guide.isOfficial && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                            <Award className="w-3 h-3 text-cyan-400" /> Official Protocol
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    <div className="flex items-center gap-1.5">
                      {/* Audio Read-Aloud TTS Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSpeech(e, guide)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${speakingGuideId === guide.id && isSpeaking
                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm'
                            : 'border-slate-700/80 bg-slate-800/80 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
                          }`}
                        title="Turn guidance text into voice audio for accessibility"
                      >
                        {speakingGuideId === guide.id && isSpeaking ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>{isPaused ? 'Resume Voice' : 'Pause Voice'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Listen Voice</span>
                          </>
                        )}
                      </button>

                      {/* Gemini AI Translate Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenTranslateModal(e, guide)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition-colors shadow-sm"
                        title="Translate guidance into 8 major languages via Gemini AI"
                      >
                        <Languages className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Translate</span>
                      </button>
                    </div>

                    <div className="hidden sm:block text-[11px] text-slate-400 text-right pl-2 border-l border-slate-800">
                      <span className="block font-semibold text-slate-200">{guide.author.name}</span>
                      <span className="text-slate-400 text-[10px]">{guide.author.organization || 'Authority Dispatch'}</span>
                    </div>

                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Body */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/50 p-4 md:p-6 space-y-6">
                    {/* Full Description */}
                    <div>
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Background & Context</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{guide.description}</p>
                    </div>

                    {/* Do's and Don'ts Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Do List */}
                      {guide.doList && guide.doList.length > 0 && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            Immediate Action Steps (DO)
                          </h4>
                          <ul className="space-y-2">
                            {guide.doList.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Don't List */}
                      {guide.dontList && guide.dontList.length > 0 && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            Prohibited Hazards (DON&apos;T)
                          </h4>
                          <ul className="space-y-2">
                            {guide.dontList.map((hazard, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span>{hazard}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Emergency Quick-Dial Contacts */}
                    {guide.emergencyContacts && guide.emergencyContacts.length > 0 && (
                      <div className="rounded-xl border border-cyan-500/30 bg-slate-900 p-4">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                          <PhoneCall className="w-4 h-4 text-cyan-400" />
                          Emergency Hotlines & Dispatch Contacts
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {guide.emergencyContacts.map((contact, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                              <div>
                                <p className="text-xs font-bold text-white">{contact.name}</p>
                                {contact.roleOrAgency && (
                                  <p className="text-[10px] text-slate-400">{contact.roleOrAgency}</p>
                                )}
                              </div>
                              <a
                                href={`tel:${contact.phone}`}
                                className="inline-flex items-center gap-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors"
                              >
                                <PhoneCall className="w-3 h-3" />
                                {contact.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Photos, Videos, Audio */}
                    {guide.media && guide.media.length > 0 && (
                      <GuidanceMediaViewer mediaItems={guide.media} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Creation Modal for Authority */}
      <CreateGuidanceModal
        userSession={userSession}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGuideCreated={() => {
          // Toast or confirmation
        }}
      />

      {/* Gemini AI Translation Modal */}
      <GuidanceTranslateModal
        guide={translatingGuide}
        isOpen={Boolean(translatingGuide)}
        onClose={() => setTranslatingGuide(null)}
      />
    </div>
  );
};
