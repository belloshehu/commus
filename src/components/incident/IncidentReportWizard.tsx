'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IncidentCategory } from '@/lib/firebase/rtdb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { DangerLevelIndicator } from '@/components/ui/DangerLevelIndicator';
import { VoiceRecorder } from './VoiceRecorder';
import { LocationPicker, LocationSelection } from './LocationPicker';
import { EvidenceUploader, UploadingFile } from './EvidenceUploader';
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Volume2,
  FileText,
  ShieldCheck,
  Lock,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { getCategoryConfig, CategoryBadge, CATEGORY_CONFIG_MAP } from '@/lib/incidentCategoryHelper';
import { DEFAULT_COMMUNITY_COORDINATES } from '@/lib/location';

export type ReportingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface IncidentReportWizardProps {
  onCompleted?: (incidentId: string, createdIncident?: any) => void;
  onCancel?: () => void;
}

export const IncidentReportWizard: React.FC<IncidentReportWizardProps> = ({
  onCompleted,
  onCancel,
}) => {
  const { session } = useAuth();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<ReportingStep>(1);

  // Form Field State
  const [category, setCategory] = useState<IncidentCategory>('CROWD_SAFETY_ALERT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);

  const [location, setLocation] = useState<LocationSelection>({
    address: DEFAULT_COMMUNITY_COORDINATES.address,
    landmark: '',
    latitude: DEFAULT_COMMUNITY_COORDINATES.latitude,
    longitude: DEFAULT_COMMUNITY_COORDINATES.longitude,
    isCurrentDeviceLocation: true,
    fuzzedLatitude: 6.52,
    fuzzedLongitude: 3.38,
    locationName: DEFAULT_COMMUNITY_COORDINATES.locationName,
    state: DEFAULT_COMMUNITY_COORDINATES.state,
    country: DEFAULT_COMMUNITY_COORDINATES.country,
  });

  const [evidenceList, setEvidenceList] = useState<UploadingFile[]>([]);
  const [dangerLevel, setDangerLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  // Step Validation logic
  const canAdvanceStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return title.trim().length >= 3 && description.trim().length >= 10;
      case 2:
        return location.latitude !== 0 && location.longitude !== 0;
      case 3:
        // Evidence is optional, but if files are uploading with errors, block
        return !evidenceList.some((item) => item.status === 'ERROR');
      case 4:
        return ['LOW', 'MEDIUM', 'HIGH'].includes(dangerLevel);
      case 5:
        return safetyConfirmed;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canAdvanceStep() && currentStep < 7) {
      setCurrentStep((prev) => (prev + 1) as ReportingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 7) {
      setCurrentStep((prev) => (prev - 1) as ReportingStep);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify({
          session,
          communityId: session.communityId || 'comm_central',
          category,
          title,
          description,
          voiceNoteUrl,
          dangerLevel,
          incidentLocation: {
            address: location.address,
            landmark: location.landmark,
            latitude: location.latitude,
            longitude: location.longitude,
          },
          evidence: evidenceList
            .filter((item) => item.status === 'SUCCESS')
            .map((item) => ({
              id: item.id,
              url: item.previewUrl,
              type: item.type,
              name: item.name,
              size: item.size,
              uploadedAt: Date.now(),
            })),
          safetyConfirmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create incident report.');
      }

      setSubmittedIncidentId(data.incidentId);
      setCurrentStep(7);

      const createdIncidentRecord = {
        id: data.incidentId,
        communityId: session.communityId || 'comm_central',
        category,
        title: title.trim(),
        description: description.trim(),
        reporterLabel: 'Reported by a verified community member',
        blurredLocation: data.blurredLocation || {
          latitude: location.fuzzedLatitude || location.latitude,
          longitude: location.fuzzedLongitude || location.longitude,
          geohash: 'dr5ru',
        },
        severity: (dangerLevel as any) || 'MEDIUM',
        status: 'SUBMITTED',
        upvotes: 0,
        downvotes: 0,
        authenticityStatus: 'UNREVIEWED',
        createdAt: Date.now(),
      };

      if (onCompleted) {
        onCompleted(data.incidentId, createdIncidentRecord);
      }
    } catch (err: any) {
      console.error('[IncidentReportWizard] Submission failure:', err);
      setSubmitError(err.message || 'Network error submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth Protection Gate
  if (!session.isAuthenticated || session.role === 'ANONYMOUS') {
    return (
      <Card variant="danger" className="max-w-xl mx-auto my-8">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-400">
            <Lock className="w-5 h-5" />
            <CardTitle>Authentication Required for Safety Reporting</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Anonymous users and unauthenticated visitors are not permitted to submit community safety reports. This policy prevents malicious spam and maintains community trust.
          </p>

          <Alert type="info">
            <strong>PRIVACY PROTECTION:</strong> When logged in, your identity is strictly isolated in private database records. Public community reports display only <em>&quot;Reported by a verified community member&quot;</em>.
          </Alert>

          <div className="flex items-center gap-3 pt-2">
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In to Account
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm">
                Create Free Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Progress Steps Bar */}
      {currentStep < 7 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              Step {currentStep} of 6 —{' '}
              {currentStep === 1 && 'Incident Description'}
              {currentStep === 2 && 'Location Details'}
              {currentStep === 3 && 'Media Evidence'}
              {currentStep === 4 && 'Danger Level Assessment'}
              {currentStep === 5 && 'Safety & Non-Confrontation'}
              {currentStep === 6 && 'Review & Final Verification'}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {Math.round((currentStep / 6) * 100)}% Completed
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 h-2">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-full rounded-full transition-all duration-300 ${
                  stepNum === currentStep
                    ? 'bg-sky-500'
                    : stepNum < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: INCIDENT DESCRIPTION */}
      {currentStep === 1 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>STEP 1 — Incident Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Incident Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Incident Category Selection">
                {Object.values(CATEGORY_CONFIG_MAP).map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setCategory(cat.key as IncidentCategory)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2.5 ${
                        isSelected
                          ? `${cat.colorClass.bg} ${cat.colorClass.border} text-slate-100 ring-2 ${cat.colorClass.glow}`
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg border shrink-0 transition-transform ${
                              isSelected ? `${cat.colorClass.iconBg} scale-105 shadow-md` : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            <IconComp className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <p className={`text-xs font-bold truncate ${isSelected ? cat.colorClass.text : 'text-slate-200'}`}>
                            {cat.label}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className={`w-4 h-4 ${cat.colorClass.text} shrink-0`} />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed w-full">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Incident Summary / Short Title"
              placeholder="e.g., Road debris blocking northbound lane on 5th Ave"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <TextArea
              label="Detailed Text Description"
              placeholder="Describe what happened, observations, and relevant surroundings (at least 10 characters)..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <VoiceRecorder
              onAudioRecorded={setVoiceNoteUrl}
              initialAudioUrl={voiceNoteUrl}
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 2: LOCATION */}
      {currentStep === 2 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>STEP 2 — Incident Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker value={location} onChange={setLocation} />
          </CardContent>
        </Card>
      )}

      {/* STEP 3: EVIDENCE */}
      {currentStep === 3 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>STEP 3 — Media Evidence (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <EvidenceUploader
              evidenceList={evidenceList}
              onChange={setEvidenceList}
            />
          </CardContent>
        </Card>
      )}

      {/* STEP 4: DANGER ASSESSMENT */}
      {currentStep === 4 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>STEP 4 — Danger Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-300">
              Classify the danger level of this incident to help community members and moderators prioritize response:
            </p>

            <div className="space-y-4">
              {/* LOW */}
              <button
                type="button"
                onClick={() => setDangerLevel('LOW')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  dangerLevel === 'LOW'
                    ? 'bg-slate-900 border-slate-400 ring-2 ring-slate-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">LOW DANGER</Badge>
                    <span className="text-xs font-bold text-slate-200">Informational / Early Warning</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  No immediate physical danger. Informational hazard (e.g. minor streetlight failure, small obstacle).
                </p>
              </button>

              {/* MEDIUM */}
              <button
                type="button"
                onClick={() => setDangerLevel('MEDIUM')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  dangerLevel === 'MEDIUM'
                    ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">MEDIUM DANGER</Badge>
                    <span className="text-xs font-bold text-slate-200">Requires Attention & Caution</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Potential hazard or disturbance requiring monitoring (e.g. road blockage, loud verbal dispute).
                </p>
              </button>

              {/* HIGH */}
              <button
                type="button"
                onClick={() => setDangerLevel('HIGH')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  dangerLevel === 'HIGH'
                    ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">HIGH DANGER</Badge>
                    <span className="text-xs font-bold text-red-200">URGENT THREAT</span>
                  </div>
                </div>
                <p className="text-xs text-red-300 font-medium mt-2">
                  ⚠️ <strong>HIGH THREAT MANDATE:</strong> High danger must be selected when there is an immediate or serious threat to life, physical safety, or active violent crime.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: SAFETY CONFIRMATION */}
      {currentStep === 5 && (
        <Card variant="danger">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>STEP 5 — Safety & Non-Confrontation Confirmation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert type="safety">
              SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.
            </Alert>

            <div className="bg-slate-950 p-5 rounded-xl border border-red-900/40 space-y-3 text-xs text-slate-200">
              <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px]">
                Mandatory Citizen Safety Rules
              </h4>
              <ul className="space-y-2 list-disc list-inside text-slate-300">
                <li><strong>Do NOT approach the incident</strong> or attempt to intervene.</li>
                <li><strong>Do NOT confront participants</strong> or escalate arguments.</li>
                <li><strong>Do NOT put yourself in danger</strong> to capture photos or audio evidence.</li>
                <li><strong>Move to a safe location</strong> immediately if you feel threatened.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => setSafetyConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-200 leading-relaxed font-semibold">
                I confirm that I am in a safe location, have read the safety guidelines above, and did not put myself or others in physical danger while gathering information for this report.
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: REVIEW */}
      {currentStep === 6 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle>STEP 6 — Review Report Before Final Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {submitError && (
              <Alert type="warning">{submitError}</Alert>
            )}

            {/* Summary Grid */}
            <div className="space-y-4">
              {/* Category & Title */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Category & Title
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-sm font-bold text-slate-100">{title}</p>
                <div className="mt-1">
                  <CategoryBadge category={category} size="md" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{description}</p>
                {voiceNoteUrl && (
                  <div className="text-xs text-sky-400 flex items-center gap-1.5 pt-2">
                    <Volume2 className="w-3.5 h-3.5" /> Voice note attached
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Target Location
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentStep(2)}
                  >
                    Edit
                  </Button>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  {location.address || location.landmark || 'Custom Coordinates Specified'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Public Fuzzed Grid: Lat {location.fuzzedLatitude}, Lng {location.fuzzedLongitude} (~1.2km radius)
                </p>
              </div>

              {/* Evidence */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Uploaded Evidence ({evidenceList.length})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => setCurrentStep(3)}
                  >
                    Edit
                  </Button>
                </div>
                {evidenceList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No media files attached.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {evidenceList.map((file) => (
                      <span
                        key={file.id}
                        className="text-[11px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-slate-300 font-mono"
                      >
                        [{file.type.toUpperCase()}] {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Level & Safety */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
                    Assessed Danger Level
                  </span>
                  <DangerLevelIndicator level={dangerLevel} />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/50">
                  <ShieldCheck className="w-4 h-4" />
                  Safety Acknowledged
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: SUBMIT SUCCESS CONFIRMATION */}
      {currentStep === 7 && submittedIncidentId && (
        <Card variant="highlight" className="text-center py-6">
          <CardContent className="space-y-5 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Incident Report Created</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your report has been broadcast to community monitors and registered on the live safety network.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 font-mono text-xs max-w-sm w-full">
              <span className="text-slate-400 text-[10px] uppercase">Incident Reference ID</span>
              <p className="text-sky-400 font-bold text-sm">#{submittedIncidentId}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Public Reporter Label: &quot;Reported by a verified community member&quot;
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Link href="/">
                <Button variant="primary" size="sm">
                  Return to Safety Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentStep(1);
                  setTitle('');
                  setDescription('');
                  setVoiceNoteUrl(null);
                  setEvidenceList([]);
                  setSafetyConfirmed(false);
                }}
              >
                Submit Another Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons Controls */}
      {currentStep < 7 && (
        <div className="flex items-center justify-between pt-2">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            {currentStep === 1 && onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div>
            {currentStep < 6 && (
              <Button
                type="button"
                variant="primary"
                disabled={!canAdvanceStep()}
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                Continue to Step {currentStep + 1}
              </Button>
            )}

            {currentStep === 6 && (
              <Button
                type="button"
                variant="danger"
                isLoading={isSubmitting}
                disabled={!canAdvanceStep()}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleSubmit}
              >
                Confirm & Submit Safety Report
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
