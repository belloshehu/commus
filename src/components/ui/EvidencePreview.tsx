import React from 'react';
import { Image as ImageIcon, Video, Mic, ShieldCheck, Eye } from 'lucide-react';
import { Badge } from './Badge';

export interface EvidenceItem {
  id: string;
  storagePath: string;
  contentType: string;
  exifScrubbed: boolean;
  url?: string;
}

export interface EvidencePreviewProps {
  items: EvidenceItem[];
  onSelectMedia?: (item: EvidenceItem) => void;
}

export const EvidencePreview: React.FC<EvidencePreviewProps> = ({
  items,
  onSelectMedia,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
        No evidence media attached.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Scrubbed Media Evidence ({items.length})
        </span>
        <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
          EXIF SCRUBBED
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((item) => {
          const isImage = item.contentType.startsWith('image/');
          const isVideo = item.contentType.startsWith('video/');
          const isAudio = item.contentType.startsWith('audio/');

          return (
            <div
              key={item.id}
              onClick={() => onSelectMedia && onSelectMedia(item)}
              className="group relative bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-lg overflow-hidden p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all aspect-video"
            >
              {isImage ? (
                item.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.url} alt="Evidence item" className="w-full h-full object-cover rounded" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-sky-400" />
                )
              ) : isVideo ? (
                <Video className="w-8 h-8 text-amber-400" />
              ) : isAudio ? (
                <Mic className="w-8 h-8 text-emerald-400" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}

              <span className="text-[10px] font-mono text-slate-400 truncate max-w-full">
                {item.contentType}
              </span>

              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
