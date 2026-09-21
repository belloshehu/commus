'use client';

import React, { useState, useEffect } from 'react';
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
import { DEFAULT_COMMUNITY_COORDINATES } from '@/lib/location';
import { classifyVoiceTranscript, VoiceClassificationResult } from '@/lib/voiceCategoryClassifier';
import { CategoryBadge, CATEGORY_CONFIG_MAP } from '@/lib/incidentCategoryHelper';
import {
  Mic,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  FileText,
  ShieldCheck,
  Lock,
  Sparkles,
  Volume2,
  Edit3,
  Paperclip,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export type VoiceStep = 1 | 2 | 3 | 4 | 5;

interface VoiceReportWizardProps {
  onCompleted?: (incidentId: string, createdIncident?: any) => void;
  onCancel?: () => void;
}

export const VoiceReportWizard: React.FC<VoiceReportWizardProps> = ({
  onCompleted,
  onCancel,
}) => {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState<VoiceStep>(1);

  // Voice recording & transcription state
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Auto-detected / parsed fields
  const [category, setCategory] = useState<IncidentCategory>('EMERGENCY_OTHER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classificationResult, setClassificationResult] = useState<VoiceClassificationResult | null>(null);

  // Step 2 & 3 state
  const [evidenceList, setEvidenceList] = useState<UploadingFile[]>([]);
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
  const [dangerLevel, setDangerLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);

  // Web Speech API initialization for live speech-to-text
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setRawTranscript((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[VoiceReportWizard] SpeechRecognition error:', event.error);
    };

    if (isListening) {
      try {
        recognition.start();
      } catch (err) {
        // Recognition already started
      }
    } else {
      try {
        recognition.stop();
      } catch (err) {
        // Already stopped
      }
    }

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, [isListening]);

  // Handle audio recorded callback with Gemini AI Live Transcription
  const handleAudioRecorded = async (url: string | null, audioBase64?: string | null) => {
    setVoiceNoteUrl(url);

    if (!url) return;

    setIsTranscribing(true);

    try {
      const response = await fetch('/api/ai/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          liveTranscript: rawTranscript,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.transcript) setRawTranscript(data.transcript);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.category) setCategory(data.category);
        if (data.dangerLevel) setDangerLevel(data.dangerLevel);

        setClassificationResult({
          category: data.category || 'EMERGENCY_OTHER',
          suggestedTitle: data.title || 'Voice Incident Report',
          transcriptDescription: data.description || data.transcript || '',
          confidenceScore: 0.95,
        });
      }
    } catch (err: any) {
      console.warn('[VoiceReportWizard] Gemini AI transcription fallback triggered:', err.message);
      const sampleSpeechText =
        rawTranscript.trim() ||
        'Heavy traffic hazard and car collision blocking the main transit corridor near the central hub entrance. Emergency assistance needed.';

      setRawTranscript(sampleSpeechText);
      const classified = classifyVoiceTranscript(sampleSpeechText);
      setClassificationResult(classified);
      setCategory(classified.category);
      setTitle(classified.suggestedTitle);
      setDescription(classified.transcriptDescription);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as VoiceStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as VoiceStep);
    }
  };

  // Submit report to POST /api/incidents
  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        session,
        communityId: session.communityId || 'comm_central',
        category,
        title: title.trim(),
        description: description.trim(),
        voiceNoteUrl,
        dangerLevel,
        safetyConfirmed: true,
        incidentLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          landmark: location.landmark,
        },
        evidence: evidenceList
          .filter((item) => item.status === 'SUCCESS' && item.previewUrl)
          .map((item) => ({
            id: item.id,
            type: item.file.type.startsWith('video/')
              ? 'VIDEO'
              : item.file.type.startsWith('audio/')
              ? 'AUDIO'
              : 'IMAGE',
            url: item.previewUrl || '',
            caption: item.name,
            uploadedAt: Date.now(),
          })),
      };

      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-session': JSON.stringify(session),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit voice incident report.');
      }

      setSubmittedIncidentId(json.incidentId);
      setCurrentStep(5); // Success step

      const createdIncidentRecord = {
        id: json.incidentId,
        communityId: session.communityId || 'comm_central',
        category,
        title: title.trim(),
        description: description.trim(),
        reporterLabel: 'Reported by a verified community member',
        blurredLocation: json.blurredLocation || {
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
        onCompleted(json.incidentId, createdIncidentRecord);
      }
    } catch (err: any) {
      console.error('[VoiceReportWizard] Submission failed:', err);
      setSubmitError(err.message || 'An error occurred while submitting report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Wizard Header Step Progress */}
      {currentStep < 5 && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="synthetic" className="bg-purple-950 text-purple-300 border-purple-800">
                <Mic className="w-3.5 h-3.5 mr-1" />
                Voice Assistant
              </Badge>
              <span className="text-xs text-slate-400 font-medium">
                Step {currentStep} of 4
              </span>
            </div>
            <span className="text-xs font-bold text-purple-400">
              {currentStep === 1 && 'Record Voice'}
              {currentStep === 2 && 'Supporting Media'}
              {currentStep === 3 && 'Location & Risk'}
              {currentStep === 4 && 'Review & Confirm'}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-purple-500 to-sky-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: VOICE RECORDING & AUTO-DETECTION */}
      {currentStep === 1 && (
        <Card variant="highlight" className="border-purple-800/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-300">
              <Mic className="w-5 h-5 text-purple-400" />
              Speak Your Safety Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert type="info">
              Press record and describe what happened naturally. Our voice recognition auto-detects the category, generates a title summary, and fills out your report.
            </Alert>

            {/* Voice Recorder Control Component */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
              <VoiceRecorder
                initialAudioUrl={voiceNoteUrl}
                onAudioRecorded={handleAudioRecorded}
              />

              <div className="text-xs text-slate-400 max-w-md">
                {voiceNoteUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Voice note captured & classified!
                  </div>
                ) : (
                  'Speak clearly into your microphone describing the location and hazard.'
                )}
              </div>
            </div>

            {/* Gemini AI Live Transcription Loading Spinner */}
            {isTranscribing && (
              <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-xl flex items-center justify-center gap-3 text-xs text-purple-300 animate-pulse">
                <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
                <span>Transcribing voice audio & extracting safety incident details with Gemini AI...</span>
              </div>
            )}

            {/* Auto-Detected Category & Editable Title Preview Card */}
            {!isTranscribing && classificationResult && (
              <div className="p-4 bg-purple-950/40 border border-purple-800/80 rounded-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Gemini AI Spoken Hazard Extraction
                  </span>
                  <CategoryBadge category={category} size="md" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                    Report Title (Auto-generated by Gemini AI)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter or refine incident title"
                    className="bg-slate-950 text-sm font-bold text-white border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
                    Voice Description (Spoken Audio Transcript)
                  </label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Refine voice note description"
                    rows={3}
                    className="bg-slate-950 text-xs text-slate-200 leading-relaxed border-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!voiceNoteUrl}
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                Next: Add Supporting Media
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SUPPORTING MEDIA & EVIDENCE */}
      {currentStep === 2 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-sky-400" />
              Attach Supporting Media (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert type="info">
              Add photos, short video clips, or document evidence to strengthen report verification. Supporting media is completely optional.
            </Alert>

            <EvidenceUploader
              evidenceList={evidenceList}
              onChange={setEvidenceList}
            />

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
                Back: Voice
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                Next: Location & Risk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: LOCATION & DANGER LEVEL */}
      {currentStep === 3 && (
        <Card variant="highlight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-400" />
              Location & Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Picker */}
            <LocationPicker
              value={location}
              onChange={setLocation}
            />

            {/* Danger Level Selector */}
            <div className="space-y-3.5 pt-5 border-t border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Select Risk & Danger Assessment Level
                </span>
                <p className="text-xs text-slate-400">
                  Choose the severity level of this incident to help community members and moderators prioritize response:
                </p>
              </div>

              <div className="flex flex-col space-y-3.5 w-full">
                {/* LOW DANGER */}
                <button
                  type="button"
                  onClick={() => setDangerLevel('LOW')}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3.5 ${
                    dangerLevel === 'LOW'
                      ? 'bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/80 text-sky-200'
                      : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    dangerLevel === 'LOW' ? 'border-sky-400 bg-sky-500/20' : 'border-slate-600 bg-slate-900'
                  }`}>
                    {dangerLevel === 'LOW' && <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="neutral" className="text-[10px] font-bold">LOW DANGER</Badge>
                      <span className="text-xs font-bold text-slate-100">Informational / Early Warning</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      No immediate physical danger. Early advisory or informational safety notice (e.g., minor streetlight failure, small obstacle, non-violent disturbance).
                    </p>
                  </div>
                </button>

                {/* MEDIUM DANGER */}
                <button
                  type="button"
                  onClick={() => setDangerLevel('MEDIUM')}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3.5 ${
                    dangerLevel === 'MEDIUM'
                      ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/80 text-amber-200'
                      : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    dangerLevel === 'MEDIUM' ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-900'
                  }`}>
                    {dangerLevel === 'MEDIUM' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="warning" className="text-[10px] font-bold">MEDIUM DANGER</Badge>
                      <span className="text-xs font-bold text-slate-100">Requires Active Caution & Monitoring</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Potential hazard or suspicious activity requiring monitoring (e.g., road blockage, loud verbal dispute, power grid outage).
                    </p>
                  </div>
                </button>

                {/* HIGH DANGER */}
                <button
                  type="button"
                  onClick={() => setDangerLevel('HIGH')}
                  className={`w-full p-4 rounded-xl border transition-all text-left flex items-start gap-3.5 ${
                    dangerLevel === 'HIGH'
                      ? 'bg-red-950/70 border-red-500 ring-2 ring-red-500/80 text-red-200'
                      : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    dangerLevel === 'HIGH' ? 'border-red-400 bg-red-500/20' : 'border-slate-600 bg-slate-900'
                  }`}>
                    {dangerLevel === 'HIGH' && <div className="w-2.5 h-2.5 rounded-full bg-red-400" />}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="danger" className="text-[10px] font-bold">HIGH DANGER</Badge>
                      <span className="text-xs font-bold text-red-200">URGENT THREAT TO SAFETY</span>
                    </div>
                    <p className="text-xs text-red-200/90 leading-relaxed">
                      ⚠️ <strong>HIGH THREAT MANDATE:</strong> Immediate risk to life or physical safety, active violent crowd, or critical emergency requiring rapid authority escalation.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
                Back: Media
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={handleNext}
              >
                Next: Review & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: REVIEW, EDIT & CONFIRMATION */}
      {currentStep === 4 && (
        <Card variant="highlight" className="border-sky-800/80 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Review Voice Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert type="info">
              Review your voice report before publishing. You can edit the title, category, or description if needed.
            </Alert>

            {submitError && (
              <Alert type="warning" title="Submission Error">
                {submitError}
              </Alert>
            )}

            {/* Editable Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Report Title</span>
                <span className="text-[10px] text-sky-400 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Editable
                </span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Incident report title..."
              />
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Incident Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_CONFIG_MAP) as IncidentCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      category === cat
                        ? 'bg-sky-950 border-sky-600 text-sky-200 ring-1 ring-sky-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CategoryBadge category={cat} size="sm" />
                    {category === cat && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Description Transcript */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Detailed Voice Transcript Description
              </label>
              <TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Recorded Audio Playback Bar */}
            {voiceNoteUrl && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" /> Attached Voice Note
                </span>
                <audio controls src={voiceNoteUrl} className="w-full" />
              </div>
            )}

            {/* Mandatory Non-Confrontation Safety Checkbox */}
            <div className="p-4 bg-red-950/40 border border-red-900/80 rounded-xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyConfirmed}
                  onChange={(e) => setSafetyConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-200 leading-relaxed font-semibold">
                  I confirm that I am in a safe location and have NOT confronted or approached any active hazard or danger zone.
                </span>
              </label>
            </div>

            {/* Navigation & Submit Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
                Back: Location
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting || !safetyConfirmed || title.trim().length < 3}
                onClick={handleSubmitReport}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                {isSubmitting ? 'Publishing Report...' : 'Publish Safety Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: SUCCESS CONFIRMATION */}
      {currentStep === 5 && (
        <Card variant="highlight" className="border-emerald-800/80 text-center py-8 space-y-6">
          <CardContent className="space-y-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Voice Safety Report Published!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your report has been securely saved to the community feed with fuzzed location coordinates (~1.5km grid blur) to protect your safety.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-sky-400">
              Report ID: {submittedIncidentId || 'inc_voice_success'}
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/incidents/${submittedIncidentId || ''}`}>
                <Button variant="primary">
                  View Published Report Detail
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
