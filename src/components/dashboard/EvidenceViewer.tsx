'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EvidenceItem } from '@/lib/firebase/rtdb';
import { ShieldCheck, Eye, EyeOff, Image as ImageIcon, Video, Music, AlertTriangle, Download } from 'lucide-react';

interface EvidenceViewerProps {
  evidence?: EvidenceItem[];
  voiceNoteUrl?: string;
  isSensitiveByDefault?: boolean;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  evidence = [],
  voiceNoteUrl,
  isSensitiveByDefault = true,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [selectedMedia, setSelectedMedia] = useState<EvidenceItem | null>(null);

  const hasEvidence = evidence.length > 0 || !!voiceNoteUrl;

  if (!hasEvidence) {
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
        No media evidence or voice notes attached to this incident report.
      </div>
    );
  }

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRevealAll = () => {
    const allRevealed = evidence.every((item) => revealedIds[item.id]);
    const newState: Record<string, boolean> = {};
    evidence.forEach((item) => {
      newState[item.id] = !allRevealed;
    });
    setRevealedIds(newState);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Evidence Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Sanitized Media Evidence ({evidence.length})
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            EXIF metadata scrubbed for privacy. Sensitive imagery blurred by default.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            EXIF SCRUBBED
          </Badge>
          {evidence.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={toggleRevealAll}
            >
              Toggle Sensitivity Blur
            </Button>
          )}
        </div>
      </div>

      {/* Optional Voice Note Player */}
      {voiceNoteUrl && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-sky-400 flex items-center gap-2">
            <Music className="w-4 h-4" /> Attached Voice Note (Audio Explanation)
          </span>
          <audio controls src={voiceNoteUrl} className="w-full h-9 rounded-lg" />
        </div>
      )}

      {/* Media Evidence Gallery Grid */}
      {evidence.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence.map((item) => {
            const isRevealed = revealedIds[item.id] || !isSensitiveByDefault;
            const isImage = item.type === 'image';
            const isVideo = item.type === 'video';
            const isAudio = item.type === 'audio';

            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group"
              >
                {/* Media Container */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                  {isImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.url}
                      alt={item.name}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        !isRevealed ? 'blur-xl scale-110 opacity-40' : ''
                      }`}
                    />
                  )}

                  {isVideo && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sky-400">
                      <Video className="w-10 h-10" />
                      <span className="text-[11px] font-mono text-slate-400">Video Recording</span>
                    </div>
                  )}

                  {isAudio && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-amber-400">
                      <Music className="w-10 h-10" />
                      <span className="text-[11px] font-mono text-slate-400">Audio Recording</span>
                    </div>
                  )}

                  {/* Sensitive Blur Overlay */}
                  {!isRevealed && (
                    <div className="absolute inset-0 bg-slate-950/70 p-4 flex flex-col items-center justify-center text-center space-y-2">
                      <EyeOff className="w-6 h-6 text-amber-400" />
                      <span className="text-[11px] font-bold text-slate-200">
                        Sensitive Media Protected
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => toggleReveal(item.id)}
                      >
                        Reveal Media
                      </Button>
                    </div>
                  )}

                  {/* Quick Inspect Button */}
                  {isRevealed && (
                    <button
                      type="button"
                      onClick={() => setSelectedMedia(item)}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Eye className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>

                {/* File Footer Info */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 truncate text-[11px]">{item.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{item.type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={isRevealed ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-sky-400" />}
                      onClick={() => toggleReveal(item.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Media Inspection Dialog */}
      <Dialog
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={`Inspect Media Evidence: ${selectedMedia?.name || ''}`}
      >
        {selectedMedia && (
          <div className="space-y-4 py-2">
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 max-h-[70vh] flex items-center justify-center">
              {selectedMedia.type === 'image' && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="max-h-[65vh] w-auto object-contain"
                />
              )}

              {selectedMedia.type === 'video' && (
                <video controls src={selectedMedia.url} className="max-h-[65vh] w-full" />
              )}

              {selectedMedia.type === 'audio' && (
                <div className="p-8 w-full">
                  <audio controls src={selectedMedia.url} className="w-full" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                EXIF GPS Tags Cleaned
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMedia(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
