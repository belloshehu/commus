'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  FileText,
  Mic,
  ArrowRight,
  X,
  Sparkles,
  ShieldAlert,
  Volume2,
  CheckCircle2,
} from 'lucide-react';

export interface ReportMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'wizard' | 'voice') => void;
}

export const ReportMethodModal: React.FC<ReportMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-method-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          aria-label="Close report method dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800 text-sky-300 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Submit Community Incident</span>
          </div>
          <h2
            id="report-method-modal-title"
            className="text-xl sm:text-2xl font-black text-white tracking-tight"
          >
            How would you like to report?
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose your preferred reporting method. Both methods guarantee reporter privacy protection with fuzzed coordinates and end-to-end security.
          </p>
        </div>

        {/* Reporting Method Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Method 1: Standard Step-by-Step Wizard */}
          <button
            onClick={() => onSelectMethod('wizard')}
            className="group relative flex flex-col justify-between p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/80 hover:bg-slate-900/90 text-left transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                    Standard Form Wizard
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Guided 7-step text form. Ideal for detailed descriptions, evidence uploads, and precise location picking.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:translate-x-0.5 transition-transform">
              <span>Start Text Report</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Method 2: Voice Command Assistant */}
          <button
            onClick={() => onSelectMethod('voice')}
            className="group relative flex flex-col justify-between p-5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/80 hover:bg-slate-900/90 text-left transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Mic className="w-5 h-5" />
                </div>
                <Badge variant="synthetic" className="bg-purple-950 text-purple-300 border-purple-800 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1 text-purple-300" />
                  Hands-Free AI
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                  Voice Command Assistant
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Speak your report naturally. Speech-to-text auto-detects category, title, description, and lets you attach media.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:translate-x-0.5 transition-transform">
              <span>Start Voice Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Safety Disclaimer Notice */}
        <Alert type="info" className="text-xs">
          <strong>Accessibility Notice:</strong> Voice Assistant is designed for fast reporting or users who prefer speaking over typing. You can review and edit all auto-detected fields before final submission.
        </Alert>
      </div>
    </div>
  );
};
