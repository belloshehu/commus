'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/AppShell';
import { IncidentReportWizard } from '@/components/incident/IncidentReportWizard';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportIncidentPage() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState('report');
  const router = useRouter();

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
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Submit Community Safety Incident
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Guided 7-step reporting workflow with reporter privacy protection and location fuzzing
            </p>
          </div>
        </div>

        {/* Multi-Step Reporting Wizard */}
        <IncidentReportWizard
          onCompleted={(incidentId) => {
            console.log('[ReportIncidentPage] Report created:', incidentId);
          }}
          onCancel={() => {
            router.push('/');
          }}
        />
      </div>
    </AppShell>
  );
}
