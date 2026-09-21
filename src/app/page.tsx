'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { IncidentCard, IncidentCardData } from '@/components/ui/IncidentCard';
import { CommunityCard } from '@/components/ui/CommunityCard';
import { DangerLevelIndicator } from '@/components/ui/DangerLevelIndicator';
import { Alert } from '@/components/ui/Alert';
import { EvidencePreview } from '@/components/ui/EvidencePreview';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Drawer } from '@/components/ui/Drawer';
import { IncidentReportWizard } from '@/components/incident/IncidentReportWizard';
import { VoiceReportWizard } from '@/components/incident/VoiceReportWizard';
import { ReportMethodModal } from '@/components/incident/ReportMethodModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AuthorityDirectory } from '@/components/authority/AuthorityDirectory';
import { EducationTab } from '@/components/education/EducationTab';
import { AlertTriangle, Plus, Search, ShieldCheck } from 'lucide-react';

const mockIncidents: IncidentCardData[] = [
  {
    id: 'inc_101',
    communityId: 'comm_central',
    category: 'CROWD_SAFETY_ALERT',
    title: 'Crowd Bottleneck Near Main Transit Hub',
    description: 'High volume gathering reported near east exit gates causing physical congestion. Authorities advised to monitor movement.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 40.7128, longitude: -74.006, geohash: 'dr5ru' },
    severity: 'HIGH',
    status: 'VERIFIED',
    createdAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'inc_102',
    communityId: 'comm_central',
    category: 'TRAFFIC_HAZARD',
    title: 'Severe Infrastructure Road Hazard',
    description: 'Debris and damaged barrier blocking two lanes on 5th Avenue. Traffic slowing down.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 40.715, longitude: -74.002, geohash: 'dr5rv' },
    severity: 'MEDIUM',
    status: 'SUBMITTED',
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'inc_103',
    communityId: 'comm_central',
    category: 'INFRASTRUCTURE_FAILURE',
    title: 'Street Lighting Failure',
    description: 'Multiple streetlights offline along 8th Street walkway. Reduced visibility.',
    reporterLabel: 'Reported by a verified community member',
    blurredLocation: { latitude: 40.71, longitude: -74.008, geohash: 'dr5rt' },
    severity: 'LOW',
    status: 'RESOLVED',
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

import { IncidentFilterBar, FilterState } from '@/components/dashboard/IncidentFilterBar';
import { IncidentFeed, filterIncidents } from '@/components/dashboard/IncidentFeed';
import { useRouter } from 'next/navigation';
import { subscribeToAllIncidents, recordVote } from '@/lib/firebase/rtdb';
import { VoteConfirmationModal } from '@/components/ui/VoteConfirmationModal';
import { useAuth } from '@/context/AuthContext';

const mockCommunities = [
  { id: 'comm_central', name: 'Downtown Central District', isPrivate: true },
  { id: 'comm_north', name: 'North Metro Transit Corridor', isPrivate: false },
  { id: 'comm_west', name: 'Westside Community Safety Zone', isPrivate: true },
];

export default function HomePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState('incidents');
  const [selectedEscalateId, setSelectedEscalateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time Database Incidents State
  const [incidents, setIncidents] = useState<IncidentCardData[]>(mockIncidents);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  // Vote Confirmation Modal State
  const [voteModal, setVoteModal] = useState<{
    isOpen: boolean;
    incidentId: string | null;
    voteType: 'UP' | 'DOWN';
  }>({
    isOpen: false,
    incidentId: null,
    voteType: 'UP',
  });

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    dangerLevel: 'ALL',
    communityId: 'comm_central',
    timeFilter: 'ALL',
    statusFilter: 'ALL',
    categoryFilter: 'ALL',
  });

  // Subscribe to real-time incident reports from Firebase Realtime Database
  React.useEffect(() => {
    setIsLoadingIncidents(true);
    let isMounted = true;

    // Safety fallback timeout: if RTDB connection hangs or takes > 1.5s, finish loading so UI doesn't freeze
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingIncidents(false);
      }
    }, 1500);

    const unsubscribe = subscribeToAllIncidents((liveRecords) => {
      clearTimeout(fallbackTimer);
      if (!isMounted) return;

      if (liveRecords && liveRecords.length > 0) {
        const mappedList: IncidentCardData[] = liveRecords.map((rec) => ({
          id: rec.id || 'inc_unknown',
          communityId: rec.communityId || 'comm_central',
          category: rec.category,
          title: rec.title,
          description: rec.description,
          reporterLabel: 'Reported by a verified community member',
          blurredLocation: rec.blurredLocation,
          severity: rec.dangerLevel || (rec.severity as any) || 'MEDIUM',
          status: rec.status,
          upvotes: rec.upvotes || 0,
          downvotes: rec.downvotes || 0,
          authenticityStatus: rec.authenticityStatus || 'UNREVIEWED',
          createdAt: rec.createdAt,
        }));
        setIncidents(mappedList);
      } else {
        // If DB has zero records, provide empty list so EmptyState is rendered cleanly
        setIncidents([]);
      }
      setIsLoadingIncidents(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const filteredIncidents = filterIncidents(incidents, filters);

  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'wizard' | 'voice'>('wizard');

  const handleSelectMethod = (method: 'wizard' | 'voice') => {
    setSelectedMethod(method);
    setIsMethodModalOpen(false);
    setIsSubmitting(true);
  };

  const handleReportSubmitted = (incidentId: string, createdIncident?: any) => {
    // 1. Close the report wizard drawer immediately
    setIsSubmitting(false);

    // 2. Switch immediately to the Incident Feed tab
    setActiveTab('incidents');

    // 3. Reset filters so the new report is visible
    setFilters({
      searchQuery: '',
      dangerLevel: 'ALL',
      communityId: 'comm_central',
      timeFilter: 'ALL',
      statusFilter: 'ALL',
      categoryFilter: 'ALL',
    });

    // 4. Prepend newly submitted report into feed state immediately for instant feedback
    if (createdIncident) {
      setIncidents((prev) => {
        const exists = prev.some((inc) => inc.id === createdIncident.id);
        if (exists) return prev;
        return [createdIncident as IncidentCardData, ...prev];
      });
    }
  };

  const handleConfirmVote = async () => {
    if (!voteModal.incidentId) return;

    try {
      await recordVote(session, voteModal.incidentId, voteModal.voteType);
    } catch (err) {
      console.warn('[HomePage] Voting action failed:', err);
    } finally {
      setVoteModal({ isOpen: false, incidentId: null, voteType: 'UP' });
    }
  };

  return (
    <AppShell
      currentLocale={locale}
      onLocaleChange={setLocale}
      activeTab={activeTab}
      onTabSelect={setActiveTab}
      alerts={[
        {
          alertId: 'alt_1',
          incidentId: 'inc_101',
          title: 'HIGH-RISK ALERT: Main Transit Hub Bottleneck',
          riskLevel: 'HIGH',
          message: 'Exercise extreme caution near East Gate exit.',
          safetyDisclaimer: 'SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter.',
          issuedAt: Date.now() - 1000 * 60 * 10,
        },
      ]}
    >
      <div className="space-y-8">
        {/* Preliminary Report Method Selection Modal */}
        <ReportMethodModal
          isOpen={isMethodModalOpen}
          onClose={() => setIsMethodModalOpen(false)}
          onSelectMethod={handleSelectMethod}
        />

        {/* Voting Confirmation Explanation Modal */}
        <VoteConfirmationModal
          isOpen={voteModal.isOpen}
          voteType={voteModal.voteType}
          onClose={() => setVoteModal({ isOpen: false, incidentId: null, voteType: 'UP' })}
          onConfirm={handleConfirmVote}
        />

        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Community Safety Dashboard
              </h1>
              <Badge variant="synthetic">LIVE RTDB FEED</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Realtime early-warning monitoring & auditable authority escalation portal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsMethodModalOpen(true)}
            >
              Report Incident
            </Button>
          </div>
        </div>

        {/* Tab Content 1: Incident Feed */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <IncidentFilterBar
              filters={filters}
              onFilterChange={setFilters}
              availableCommunities={mockCommunities}
              totalResultsCount={filteredIncidents.length}
            />

            {isLoadingIncidents ? (
              <LoadingState label="Connecting to Realtime Safety Database..." />
            ) : (
              <IncidentFeed
                incidents={incidents}
                filters={filters}
                onViewDetails={(id) => router.push(`/incidents/${id}`)}
                onEscalate={(id) => setSelectedEscalateId(id)}
                onVote={(id, voteType) => setVoteModal({ isOpen: true, incidentId: id, voteType })}
                onRequestReport={() => setIsMethodModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Tab Content 3: Community Alerts */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-100">Design System Danger Level Showcase</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <DangerLevelIndicator level="HIGH" showSafetyBanner />
              <DangerLevelIndicator level="MEDIUM" />
              <DangerLevelIndicator level="LOW" />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active Community Safety Zones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CommunityCard
                  id="comm_1"
                  name="Downtown Central District"
                  isPrivate={true}
                  geohashPrefix="dr5ru"
                  memberCount={1420}
                  activeIncidentsCount={2}
                />
                <CommunityCard
                  id="comm_2"
                  name="North Metro Transit Corridor"
                  isPrivate={false}
                  geohashPrefix="dr5rv"
                  memberCount={890}
                  activeIncidentsCount={0}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Education & Engagement */}
        {activeTab === 'education' && (
          <EducationTab
            userSession={{
              userId: 'user_demo_101',
              role: 'VERIFIED_COMMUNITY_LEADER',
              isAuthenticated: true,
              communityIds: ['comm_central'],
            }}
          />
        )}

        {/* Tab Content 4: Safety Guidance */}
        {activeTab === 'guidance' && (
          <div className="space-y-6">
            <Alert type="safety">
              SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.
            </Alert>
            <Card>
              <CardHeader>
                <CardTitle>Antijj Non-Confrontation UX Principles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  1. <strong>Detect & Alert</strong>: Antijj is designed strictly as an early-warning platform to inform citizens of safety hazards in their community.
                </p>
                <p>
                  2. <strong>Anti-Vigilantism Guarantee</strong>: The application never provides tools for public accusation, mob coordination, or confronting crowd situations.
                </p>
                <p>
                  3. <strong>Audited Escalation</strong>: Qualifying high-risk hazards are escalated to authorized dispatchers through cryptographically signed audit logs.
                </p>
              </CardContent>
            </Card>

            <EvidencePreview
              items={[
                { id: 'm1', storagePath: 'evidence/c1/i1/m1.jpg', contentType: 'image/jpeg', exifScrubbed: true },
                { id: 'm2', storagePath: 'evidence/c1/i1/m2.mp4', contentType: 'video/mp4', exifScrubbed: true },
                { id: 'm3', storagePath: 'evidence/c1/i1/m3.mp3', contentType: 'audio/mpeg', exifScrubbed: true },
              ]}
            />
          </div>
        )}

        {/* Tab Content 5: Authority Dispatch Portal */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            <AuthorityDirectory
              incidents={mockIncidents as any}
              userSession={{
                userId: 'user_local_dispatcher',
                role: 'AUTHORITY_DISPATCHER',
                isAuthenticated: true,
              }}
            />

            <Card variant="danger">
              <CardHeader>
                <CardTitle>Emergency Authority Dispatch Audit Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-red-200">
                  Dispatcher Portal: Decrypting precise coordinates requires authorized <code className="text-white">AUTHORITY_DISPATCHER</code> credentials and creates an immutable SHA-256 audit record.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Incident Submission Dialog */}
        <ConfirmationDialog
          isOpen={!!selectedEscalateId}
          onClose={() => setSelectedEscalateId(null)}
          onConfirm={() => {
            setSelectedEscalateId(null);
          }}
          title="Escalate Incident to Authorities"
          message="Are you sure you want to escalate this incident report to authorized emergency dispatchers?"
          isHighGravity={true}
          confirmLabel="Escalate Now"
        />

        {/* Drawer: Submit Incident Reporting Wizard */}
        <Drawer
          isOpen={isSubmitting}
          onClose={() => setIsSubmitting(false)}
          title={selectedMethod === 'voice' ? 'Submit Voice Safety Report' : 'Submit Community Safety Report'}
        >
          <div className="py-2">
            {selectedMethod === 'voice' ? (
              <VoiceReportWizard
                onCompleted={handleReportSubmitted}
                onCancel={() => setIsSubmitting(false)}
              />
            ) : (
              <IncidentReportWizard
                onCompleted={handleReportSubmitted}
                onCancel={() => setIsSubmitting(false)}
              />
            )}
          </div>
        </Drawer>
      </div>
    </AppShell>
  );
}
