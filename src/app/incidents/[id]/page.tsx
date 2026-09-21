'use client';

import React, { useEffect, useState, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/shell/AppShell';
import { IncidentRecord, subscribeToIncident, subscribeToActiveCoordination, ActiveCoordination } from '@/lib/firebase/rtdb';
import { canViewPrivateCommunityIncidents } from '@/lib/auth';
import { DangerLevelIndicator } from '@/components/ui/DangerLevelIndicator';
import { Badge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/lib/incidentCategoryHelper';
import { VoteConfirmationModal } from '@/components/ui/VoteConfirmationModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EvidenceViewer } from '@/components/dashboard/EvidenceViewer';
import { IncidentMapView } from '@/components/dashboard/IncidentMapView';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowLeft,
  Lock,
  Activity,
  AlertTriangle,
  Radio,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Globe,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { IncidentTranslateModal } from '@/components/incident/IncidentTranslateModal';

// Mock detailed fallback incidents for local synthetic testing
const mockDetailIncidents: Record<string, IncidentRecord> = {
  inc_101: {
    id: 'inc_101',
    communityId: 'comm_central',
    category: 'CROWD_SAFETY_ALERT',
    title: 'Crowd Bottleneck Near Main Transit Hub',
    description:
      'High volume gathering reported near east exit gates causing physical congestion. Authorities advised to monitor movement.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 6.5244, longitude: 3.3792, geohash: 'geo_65_34' },
    encryptedPreciseLocation: 'payload_encrypted',
    severity: 'HIGH',
    dangerLevel: 'HIGH',
    status: 'VERIFIED',
    authorityNotificationStatus: 'NOTIFIED',
    moderationStatus: 'APPROVED',
    createdAt: Date.now() - 1000 * 60 * 15,
    updatedAt: Date.now() - 1000 * 60 * 5,
    evidence: [
      {
        id: 'ev_1',
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        type: 'image',
        name: 'gate_crowd_photo.jpg',
        size: 1540000,
        uploadedAt: Date.now() - 1000 * 60 * 14,
      },
    ],
  },
  inc_102: {
    id: 'inc_102',
    communityId: 'comm_central',
    category: 'TRAFFIC_HAZARD',
    title: 'Severe Infrastructure Road Hazard',
    description: 'Debris and damaged barrier blocking two lanes on 5th Avenue. Traffic slowing down.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 6.528, longitude: 3.375, geohash: 'geo_65_34' },
    encryptedPreciseLocation: 'payload_encrypted',
    severity: 'MEDIUM',
    dangerLevel: 'MEDIUM',
    status: 'SUBMITTED',
    authorityNotificationStatus: 'PENDING',
    moderationStatus: 'UNREVIEWED',
    createdAt: Date.now() - 1000 * 60 * 45,
    updatedAt: Date.now() - 1000 * 60 * 45,
  },
  inc_103: {
    id: 'inc_103',
    communityId: 'comm_central',
    category: 'INFRASTRUCTURE_FAILURE',
    title: 'Street Lighting Failure',
    description: 'Multiple streetlights offline along 8th Street walkway. Reduced visibility.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 6.52, longitude: 3.38, geohash: 'geo_65_34' },
    encryptedPreciseLocation: 'payload_encrypted',
    severity: 'LOW',
    dangerLevel: 'LOW',
    status: 'RESOLVED',
    authorityNotificationStatus: 'SKIPPED',
    moderationStatus: 'APPROVED',
    createdAt: Date.now() - 1000 * 60 * 120,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
};

export default function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ id: string }>) : (params as any);
  const incidentId = resolvedParams?.id || '';

  const { session } = useAuth();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');

  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [coordination, setCoordination] = useState<ActiveCoordination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(null);
  const [pendingVote, setPendingVote] = useState<'UP' | 'DOWN' | null>(null);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);

  // Text-to-speech accessibility hook
  const { isSpeaking, isPaused, speak, pause, resume, stop } = useTextToSpeech({ lang: 'english' });

  const handleToggleSpeech = () => {
    if (!incident) return;
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      const danger = incident.dangerLevel || (incident.severity as any) || 'Medium';
      const speechText = `Incident Report: ${incident.title}. Danger Level: ${danger}. Verification Status: ${incident.status}. Category: ${incident.category}. Detailed Description: ${incident.description}.`;
      speak(speechText, 'english');
    }
  };

  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    if (!incidentId) return;
    try {
      const res = await fetch(`/api/incidents/${incidentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();
      if (data.success && incident) {
        setUserVote(data.userVote);
        setIncident((prev) =>
          prev
            ? {
                ...prev,
                upvotes: data.upvotes,
                downvotes: data.downvotes,
                authenticityStatus: data.authenticityStatus,
              }
            : null
        );
      }
    } catch (err: any) {
      console.warn('Vote submission error:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setAuthError(null);
    let isMounted = true;

    // Fallback timer if Firebase RTDB connection takes longer than 1.5s
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1500);

    // Initial check with fallback synthetic or RTDB subscription
    const mockMatch = mockDetailIncidents[incidentId];
    if (mockMatch) {
      if (!canViewPrivateCommunityIncidents(session, mockMatch.communityId)) {
        setAuthError('UNAUTHORIZED: You do not have permission to view safety incidents from this community zone.');
        setIsLoading(false);
        clearTimeout(fallbackTimer);
        return;
      }
      setIncident({
        ...mockMatch,
        reporterLabel: 'Reported by a verified community member',
      });
      setIsLoading(false);
      clearTimeout(fallbackTimer);
    }

    // Subscribe to live RTDB incident updates
    const unsubIncident = subscribeToIncident(incidentId, (liveData) => {
      clearTimeout(fallbackTimer);
      if (!isMounted) return;
      if (liveData) {
        if (!canViewPrivateCommunityIncidents(session, liveData.communityId)) {
          setAuthError('UNAUTHORIZED: You do not have permission to view safety incidents from this community zone.');
          setIncident(null);
        } else {
          setIncident({
            ...liveData,
            reporterLabel: 'Reported by a verified community member',
          });
        }
      }
      setIsLoading(false);
    });

    // Subscribe to active response updates
    const unsubCoord = subscribeToActiveCoordination(incidentId, (coordData) => {
      if (!isMounted) return;
      setCoordination(coordData);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubIncident();
      unsubCoord();
    };
  }, [incidentId, session]);

  return (
    <AppShell currentLocale={locale} onLocaleChange={setLocale} activeTab="incidents">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link href="/">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Incident Dashboard
            </Button>
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Incident Ref: <strong className="text-sky-400">#{incidentId}</strong>
          </span>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState label="Loading incident safety details..." />}

        {/* Authorization Denied Gate */}
        {authError && (
          <Card variant="danger">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-400">
                <Lock className="w-5 h-5" />
                <CardTitle>Access Denied: Private Community Zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">{authError}</p>
              <Alert type="info">
                Community safety reports are strictly restricted to verified members of that specific community zone to prevent harassment and unauthorized surveillance.
              </Alert>
              <Link href="/">
                <Button variant="primary" size="sm">
                  Return to My Safety Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Incident Detail Content */}
        {!isLoading && !authError && incident && (
          <div className="space-y-6">
            {/* Header Title Card */}
            <Card variant={incident.dangerLevel === 'HIGH' ? 'danger' : 'highlight'}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.status === 'VERIFIED' ? 'success' : incident.status === 'ESCALATED' ? 'danger' : 'info'}>
                      STATUS: {incident.status}
                    </Badge>
                    <CategoryBadge category={incident.category} size="md" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported {new Date(incident.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <CardTitle className="text-xl font-black text-white">
                  {incident.title}
                </CardTitle>

                {/* Accessibility Voice Audio & Multilingual Translation Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSpeech}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all ${
                        isSpeaking
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold ring-2 ring-amber-400/40'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300'
                      }`}
                      title="Listen to this incident report read aloud for accessibility"
                    >
                      {isSpeaking ? (
                        <>
                          {isPaused ? <Play className="w-4 h-4 text-slate-950" /> : <Pause className="w-4 h-4 text-slate-950" />}
                          <span>{isPaused ? 'Resume Voice' : 'Pause Voice'}</span>
                          <span className="flex items-center gap-0.5 ml-1">
                            <span className="h-2 w-0.5 animate-pulse bg-slate-950" />
                            <span className="h-3 w-0.5 animate-pulse bg-slate-950 delay-75" />
                            <span className="h-2 w-0.5 animate-pulse bg-slate-950 delay-150" />
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-cyan-400" />
                          <span>Listen to Report (Voice)</span>
                        </>
                      )}
                    </button>

                    {isSpeaking && (
                      <button
                        type="button"
                        onClick={stop}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                        title="Stop Voice Playback"
                      >
                        <VolumeX className="w-4 h-4 text-rose-400" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      stop();
                      setIsTranslateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 transition-all shadow-sm"
                    title="Translate report to English, Arabic, Portuguese, French, Swahili, Yoruba, Hausa, or Igbo"
                  >
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>Translate Report</span>
                    <span className="rounded-full bg-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-200">
                      8 Languages
                    </span>
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Danger Level Indicator */}
                <DangerLevelIndicator
                  level={incident.dangerLevel || (incident.severity as any) || 'MEDIUM'}
                  showSafetyBanner={incident.dangerLevel === 'HIGH' || incident.severity === 'HIGH'}
                />

                {/* Questionable Authenticity Warning Banner */}
                {(incident.authenticityStatus === 'QUESTIONABLE_AUTHENTICITY' ||
                  ((incident.upvotes || 0) + (incident.downvotes || 0) > 0 &&
                    (incident.downvotes || 0) / ((incident.upvotes || 0) + (incident.downvotes || 0)) > 0.20)) && (
                  <Alert type="danger">
                    <strong>QUESTIONABLE AUTHENTICITY ALERT:</strong> Over 20% of community member votes indicate this report may contain unverified or questionable information ({incident.downvotes || 0} downvotes out of {(incident.upvotes || 0) + (incident.downvotes || 0)} total votes). Please verify with caution.
                  </Alert>
                )}

                {/* Community Voting Controls */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block">Community Authenticity Approval</span>
                    <span className="text-[11px] text-slate-400">Vote to approve or question report accuracy</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1.5">
                    <button
                      type="button"
                      onClick={() => setPendingVote('UP')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        userVote === 'UP'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{incident.upvotes || 0} Upvotes</span>
                    </button>
                    <div className="h-5 w-px bg-slate-800" />
                    <button
                      type="button"
                      onClick={() => setPendingVote('DOWN')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                        userVote === 'DOWN'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{incident.downvotes || 0} Downvotes</span>
                    </button>
                  </div>
                </div>

                <VoteConfirmationModal
                  isOpen={Boolean(pendingVote)}
                  voteType={pendingVote}
                  incidentTitle={incident.title}
                  onClose={() => setPendingVote(null)}
                  onConfirm={() => {
                    if (pendingVote) {
                      handleVote(pendingVote);
                    }
                    setPendingVote(null);
                  }}
                />

                {/* Reporter Privacy Label Guarantee */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{incident.reporterLabel || 'Reported by a verified community member'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    [Reporter Identity Isolated]
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Description & Voice Note */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle>Detailed Incident Description</CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSpeech}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                        isSpeaking
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40'
                      }`}
                      title="Listen to description aloud"
                    >
                      {isSpeaking ? (
                        <>
                          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Listen (Voice)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stop();
                        setIsTranslateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/30 px-2.5 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900/40 transition-colors"
                      title="Translate incident description"
                    >
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      <span>Translate</span>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {incident.description}
                </p>

                {incident.voiceNoteUrl && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-sky-400">Attached Voice Explanation</span>
                    <audio controls src={incident.voiceNoteUrl} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Incident Location & Fuzzed Area Interactive Map */}
            <IncidentMapView
              latitude={incident.blurredLocation?.latitude || 40.7128}
              longitude={incident.blurredLocation?.longitude || -74.0060}
              geohash={incident.blurredLocation?.geohash || 'Zone dr5ru'}
              locationName={incident.incidentLocation?.locationName || 'Central District'}
              state={incident.incidentLocation?.state || 'Lagos State'}
              country={incident.incidentLocation?.country || 'Nigeria'}
              address={incident.incidentLocation?.address}
            />

            {/* Media Evidence Gallery */}
            <EvidenceViewer
              evidence={incident.evidence || []}
              voiceNoteUrl={incident.voiceNoteUrl}
            />

            {/* Active Response Updates & Coordination Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Active Response Updates & Coordination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {coordination ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 uppercase">
                        Dispatch Status: {coordination.status}
                      </span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        Updated {new Date(coordination.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {coordination.coordinationNotes}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-400 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>Real-time response coordination monitoring active. No dispatcher notes issued yet.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Multilingual Translation Modal */}
        <IncidentTranslateModal
          incident={
            incident
              ? {
                  id: incident.id,
                  title: incident.title,
                  description: incident.description,
                  category: incident.category,
                  dangerLevel: incident.dangerLevel || (incident.severity as any) || 'MEDIUM',
                  status: incident.status,
                }
              : null
          }
          isOpen={isTranslateModalOpen}
          onClose={() => setIsTranslateModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
