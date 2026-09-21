'use client';

import React, { useState, Suspense } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { IncidentReportWizard } from '@/components/incident/IncidentReportWizard';
import { VoiceReportWizard } from '@/components/incident/VoiceReportWizard';
import { ReportMethodModal } from '@/components/incident/ReportMethodModal';
import { ShieldAlert, FileText, Mic, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMethod = searchParams.get('method') === 'voice' ? 'voice' : searchParams.get('method') === 'wizard' ? 'wizard' : null;

  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState('report');
  const [reportingMethod, setReportingMethod] = useState<'wizard' | 'voice' | null>(initialMethod);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(!initialMethod);

  const handleSelectMethod = (method: 'wizard' | 'voice') => {
    setReportingMethod(method);
    setIsMethodModalOpen(false);
  };

  return (
    <AppShell
      currentLocale={locale}
      onLocaleChange={setLocale}
      activeTab={activeTab}
      onTabSelect={(tab) => {
        setActiveTab(tab);
        if (tab !== 'report') {
          router.push('/');
        }
      }}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Submit Community Safety Incident
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {reportingMethod === 'voice'
                  ? 'Hands-free Voice Assistant with auto-category detection & optional media upload'
                  : 'Guided step-by-step reporting workflow with location fuzzing & reporter privacy protection'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMethodModalOpen(true)}
            icon={reportingMethod === 'voice' ? <Mic className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-sky-400" />}
          >
            Switch Method ({reportingMethod === 'voice' ? 'Voice Assistant' : 'Standard Wizard'})
          </Button>
        </div>

        {/* Preliminary Selection Modal */}
        <ReportMethodModal
          isOpen={isMethodModalOpen}
          onClose={() => setIsMethodModalOpen(false)}
          onSelectMethod={handleSelectMethod}
        />

        {/* Render Selected Wizard */}
        {reportingMethod === 'voice' ? (
          <VoiceReportWizard
            onCompleted={(incidentId) => {
              console.log('[ReportIncidentPage] Voice report created:', incidentId);
              router.push('/?tab=incidents');
            }}
            onCancel={() => {
              router.push('/?tab=incidents');
            }}
          />
        ) : (
          <IncidentReportWizard
            onCompleted={(incidentId) => {
              console.log('[ReportIncidentPage] Text report created:', incidentId);
              router.push('/?tab=incidents');
            }}
            onCancel={() => {
              router.push('/?tab=incidents');
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function ReportIncidentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading reporting assistant...</div>}>
      <ReportPageContent />
    </Suspense>
  );
}
