'use client';

import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Mic,
  Volume2,
  Globe,
  Lock,
  Award,
  Activity,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  MapPin,
  Cpu,
  Layers,
  HeartHandshake,
} from 'lucide-react';

export interface AboutTabProps {
  onNavigateTab?: (tabId: string) => void;
  onReportClick?: () => void;
}

type FeatureCategory = 'all' | 'reporting' | 'guidance' | 'ai' | 'privacy' | 'dispatch' | 'civic';

interface FeatureCardData {
  id: string;
  category: FeatureCategory;
  categoryLabel: string;
  categoryColor: string;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  actionLabel?: string;
  targetTab?: string;
  isActionReport?: boolean;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  onNavigateTab,
  onReportClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>('all');

  const categories: { id: FeatureCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Capabilities', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'reporting', label: 'Incident Reporting', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'guidance', label: 'Safety Guidance', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI & Accessibility', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'dispatch', label: 'Authority Dispatch', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'civic', label: 'Civic Badges', icon: <Award className="w-3.5 h-3.5" /> },
  ];

  const features: FeatureCardData[] = [
    {
      id: 'reporting',
      category: 'reporting',
      categoryLabel: 'Citizen Reporting',
      categoryColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      icon: <Mic className="w-5 h-5 text-emerald-400" />,
      title: 'Voice-First & Guided Incident Reporting',
      tagline: 'Rapid emergency reporting via voice audio or multi-step wizard',
      description:
        'Citizens in distress can report crises in seconds using one-tap voice recording powered by Gemini audio transcription or through an intuitive multi-step wizard with photo and video evidence.',
      highlights: [
        'Live microphone audio recording with visual soundwave animation',
        'Automatic Gemini AI voice transcription for rapid situational capture',
        'Multi-photo and video evidence attachments with preview player',
        'Automated categorization (Fire, Gas, Traffic, Mob Justice, Theft, Vandalism)',
      ],
      actionLabel: 'Report an Incident',
      isActionReport: true,
    },
    {
      id: 'hazard-feed',
      category: 'reporting',
      categoryLabel: 'Situational Awareness',
      categoryColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      icon: <Activity className="w-5 h-5 text-sky-400" />,
      title: 'Real-Time Hazard Early-Warning Feed & Consensus Voting',
      tagline: 'Instant push updates and community consensus verification',
      description:
        'Live hazard alerts stream directly across the real-time emergency network with 3-tier threat severity levels and community voting to verify authenticity and flag misinformation.',
      highlights: [
        'Zero-latency push updates across the live hazard network',
        'Community authenticity voting (Upvote / Downvote system with confirmation modal)',
        'Automatic Questionable Authenticity Alert when downvotes exceed 20%',
        'Rich filtering by Danger Level (High, Medium, Low), Category, and Community Zone',
      ],
      actionLabel: 'View Live Incident Feed',
      targetTab: 'incidents',
    },
    {
      id: 'guidance',
      category: 'guidance',
      categoryLabel: 'Public Safety',
      categoryColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      title: 'Authority-Published Safety Guidance & Protocols',
      tagline: 'Actionable emergency manuals with multimedia instructions',
      description:
        'Public safety guidelines authored exclusively by verified authorities (Police, Fire, Disaster Agencies) with concrete DOs and DON&apos;Ts to protect life and property.',
      highlights: [
        'Role-gated publishing: strictly restricted to verified emergency authorities',
        'Covers 8 critical areas: Fire, Gas Leakage, Traffic, Mob Violence, Theft, Vandalism, Flooding, Building Collapse',
        'Clear action items: Recommended DOs vs Prohibited Hazards (DON&apos;Ts)',
        'Attached instructional multimedia (Audio guides, Video drills, Photo walkthroughs)',
      ],
      actionLabel: 'Explore Safety Guidance',
      targetTab: 'guidance',
    },
    {
      id: 'voice-tts',
      category: 'ai',
      categoryLabel: 'Accessibility',
      categoryColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      icon: <Volume2 className="w-5 h-5 text-amber-400" />,
      title: 'Universal Text-to-Voice (TTS) Audio Playback',
      tagline: 'Auditory access for literacy, visual impairment, and hands-free safety',
      description:
        'Every safety guide and incident report detail features built-in Web Speech Text-to-Speech playback with pause, resume, and live soundwave feedback in the user&apos;s selected language.',
      highlights: [
        'Speech synthesis directly in the browser with zero external latency',
        'Interactive audio controls: Play, Pause, Resume, and Stop with animated sound waves',
        'Auditory readout of incident title, severity, category, and full instructions',
        'BCP 47 language mapping matching the active translation tongue',
      ],
      actionLabel: 'Listen in Safety Guidance',
      targetTab: 'guidance',
    },
    {
      id: 'ai-translation',
      category: 'ai',
      categoryLabel: 'Multilingual AI',
      categoryColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      title: 'Gemini AI Multilingual Crisis Translation',
      tagline: 'Instant translation into 8 major languages for inclusive emergency response',
      description:
        'Commus translates emergency warnings, instructions, and reports on-demand using Google Gemini 1.5 Flash with fallback logic to ensure communication during network disruptions.',
      highlights: [
        'Supported Languages: English, Arabic (العربية), Portuguese (Português), French (Français), Swahili (Kiswahili), Yoruba (Èdè Yorùbá), Hausa (Harshen Hausa), and Igbo (Asụsụ Igbo)',
        'Full RTL (Right-to-Left) typography support for Arabic scripts',
        'Preserves vital emergency safety terminology, precautions, and urgency tone',
        'One-click translation text copying and synchronized voice audio in that language',
      ],
      actionLabel: 'Test Translation in Guides',
      targetTab: 'guidance',
    },
    {
      id: 'privacy',
      category: 'privacy',
      categoryLabel: 'Zero-Knowledge Privacy',
      categoryColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      icon: <Lock className="w-5 h-5 text-rose-400" />,
      title: 'Zero-Knowledge Privacy & Location Fuzzing',
      tagline: 'Differential privacy to protect whistleblowers and citizen reporters',
      description:
        'Citizen safety should never compromise personal privacy. Commus isolates reporter identities and automatically fuzzes precise GPS coordinates into regional geohashes.',
      highlights: [
        'Reporter identity isolation: public displays show only verified anonymity labels',
        'Geohash differential location fuzzing protects home privacy while indicating hazard zones',
        'Encrypted precise location accessible only under audited emergency escalations',
        'Private community safety zones to prevent unauthorized outside surveillance',
      ],
      actionLabel: 'Inspect Privacy Design',
      targetTab: 'alerts',
    },
    {
      id: 'dispatch',
      category: 'dispatch',
      categoryLabel: 'Multi-Agency Response',
      categoryColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      icon: <Radio className="w-5 h-5 text-blue-400" />,
      title: 'Authority Directory & Audited Dispatch Portal',
      tagline: 'Bridging grassroots citizen reports with verified first responders',
      description:
        'A comprehensive directory of emergency authorities (Fire Service, Police, Road Safety, Healthcare) with one-tap emergency calling and auditable incident escalation tracking.',
      highlights: [
        'Directory of verified emergency services with jurisdiction tags and hotline buttons',
        'Two-way dispatch tracking: Dispatch status and coordinator field notes in real-time',
        'Auditable escalation logs preventing negligence and improving emergency response times',
        'Non-confrontation policy enforcement preventing vigilantism and mob escalation',
      ],
      actionLabel: 'Open Authority Directory',
      targetTab: 'dispatch',
    },
    {
      id: 'education',
      category: 'civic',
      categoryLabel: 'Civic Engagement',
      categoryColor: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
      icon: <Award className="w-5 h-5 text-yellow-400" />,
      title: 'Civic Education, Drills & Gamified Badges',
      tagline: 'Fostering proactive community preparedness through safety incentives',
      description:
        'Commus educates citizens through interactive safety drills and gamified badges that reward community vigilance, authentic reporting, and disaster preparedness.',
      highlights: [
        'Earn verifiable badges: First Responder, Safety Vanguard, Community Watcher',
        'Educational civic campaigns on fire safety, flood response, and neighborhood security',
        'Progress tracking with achievements and community leaderboards',
        'Empowers proactive preparedness over reactive panic during disasters',
      ],
      actionLabel: 'View Civic Badges',
      targetTab: 'education',
    },
  ];

  const filteredFeatures =
    selectedCategory === 'all'
      ? features
      : features.filter((f) => f.category === selectedCategory);

  const handleAction = (feature: FeatureCardData) => {
    if (feature.isActionReport && onReportClick) {
      onReportClick();
    } else if (feature.targetTab && onNavigateTab) {
      onNavigateTab(feature.targetTab);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl">
        {/* Glow effect backdrop */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <span>Commus Civic Safety & Rapid Hazard Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Decentralized Community Safety, Anonymous Reporting &{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              AI Crisis Response
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Commus bridges citizens, local communities, and emergency responders with
            privacy-preserving early hazard warnings, verified multi-agency dispatch, and
            universal multilingual crisis intelligence powered by Google Gemini AI.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="block text-xl font-extrabold text-cyan-400">8 Languages</span>
              <span className="text-[11px] text-slate-400">Gemini AI Crisis Translation</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="block text-xl font-extrabold text-emerald-400">Real-Time</span>
              <span className="text-[11px] text-slate-400">Zero-Latency Hazard Feed</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="block text-xl font-extrabold text-purple-400">Zero-Knowledge</span>
              <span className="text-[11px] text-slate-400">Reporter Identity Isolation</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="block text-xl font-extrabold text-amber-400">Audited</span>
              <span className="text-[11px] text-slate-400">Multi-Agency Dispatch</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onReportClick && (
              <button
                type="button"
                onClick={onReportClick}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950" />
                <span>Report an Incident Now</span>
              </button>
            )}
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('guidance')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-all"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>View Safety Guidelines</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Feature Explorer */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Core Architectural Pillars
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Explore Platform Capabilities
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a category to inspect specific features and jump directly to test them live
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border border-cyan-400'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatures.map((feat) => (
            <div
              key={feat.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/5 hover:-translate-y-0.5"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${feat.categoryColor}`}
                  >
                    {feat.categoryLabel}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 transition-transform group-hover:scale-110">
                    {feat.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {feat.tagline}
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {feat.description}
                </p>

                {/* Highlights list */}
                <ul className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  {feat.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Action */}
              {feat.actionLabel && (
                <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAction(feat)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors group/btn"
                  >
                    <span>{feat.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Commus Core Module
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Architecture & Dataflow Flowchart */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">
            Data Integrity & Dispatch Lifecycle
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            How Commus Coordinates Emergency Safety
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            From citizen hazard detection to audited first-responder mobilization
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                1
              </span>
              <Mic className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Citizen Hazard Capture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Voice recording or structured wizard reports incident with attached multimedia evidence.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs">
                2
              </span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Zero-Knowledge Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reporter identity is severed from public feed. GPS is fuzzed into regional geohashes to protect privacy.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs">
                3
              </span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-white text-sm">AI Translation & Consensus</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Community votes on authenticity; Gemini AI translates alert into 8 languages with speech synthesis.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                4
              </span>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-sm">Audited Authority Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified responders acknowledge dispatch, provide live notes, and enforce peaceful non-confrontation.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack & Open Standards */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Engineering & Technology Stack</h3>
            <p className="text-xs text-slate-400">
              Modern enterprise-grade stack optimized for resilience and zero-latency emergency response
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Next.js 15</span>
            <span className="text-[10px] text-slate-400 font-mono">App Router</span>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Live Push Engine</span>
            <span className="text-[10px] text-slate-400 font-mono">Real-time Sync</span>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Gemini 1.5 Flash</span>
            <span className="text-[10px] text-slate-400 font-mono">Multimodal AI</span>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Web Speech API</span>
            <span className="text-[10px] text-slate-400 font-mono">TTS Audio</span>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Geohash Spatial</span>
            <span className="text-[10px] text-slate-400 font-mono">Differential GPS</span>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-center">
            <span className="block font-bold text-white text-xs">Vitest Suite</span>
            <span className="text-[10px] text-slate-400 font-mono">100% Passing</span>
          </div>
        </div>
      </div>

      {/* Non-confrontation & Community Shield Guarantee Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Civic Safety & Non-Confrontation Guarantee
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
              Commus is built strictly for situational awareness, verified emergency dispatch, and life safety.
              We reject vigilantism, confrontation, or unauthorized policing. Safety first, always.
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('incidents')}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          >
            <span>Explore Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
