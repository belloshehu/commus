'use client';

import React, { useState } from 'react';
import { GuidanceMedia } from '@/lib/guidance/types';
import { Play, Pause, Volume2, Image as ImageIcon, Video as VideoIcon, Radio } from 'lucide-react';

interface GuidanceMediaViewerProps {
  mediaItems: GuidanceMedia[];
}

export const GuidanceMediaViewer: React.FC<GuidanceMediaViewerProps> = ({ mediaItems }) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [activeImageModalUrl, setActiveImageModalUrl] = useState<string | null>(null);

  if (!mediaItems || mediaItems.length === 0) {
    return null;
  }

  const handleToggleAudio = (mediaId: string, audioUrl: string) => {
    if (playingAudioId === mediaId && audioElement) {
      audioElement.pause();
      setPlayingAudioId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play().catch((err) => console.warn('Audio playback failed:', err));
      newAudio.onended = () => setPlayingAudioId(null);
      setAudioElement(newAudio);
      setPlayingAudioId(mediaId);
    }
  };

  return (
    <div className="space-y-3 mt-4 border-t border-slate-800/80 pt-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        Official Guidance Attachments ({mediaItems.length})
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mediaItems.map((item) => {
          if (item.type === 'image') {
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-2 transition-all hover:border-cyan-500/40"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-950">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
                  <button
                    onClick={() => setActiveImageModalUrl(item.url)}
                    className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-slate-900/80 hover:bg-cyan-600 text-white px-2.5 py-1 rounded-md backdrop-blur border border-slate-700 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    View Photo
                  </button>
                </div>
                <div className="mt-2 px-1">
                  <p className="text-xs font-medium text-slate-200">{item.title}</p>
                  {item.caption && <p className="text-[11px] text-slate-400 mt-0.5">{item.caption}</p>}
                </div>
              </div>
            );
          }

          if (item.type === 'video') {
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 transition-all hover:border-purple-500/40"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    className="h-full w-full object-contain"
                    poster={item.thumbnailUrl}
                  />
                </div>
                <div className="mt-2 px-1 flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-200">{item.title}</p>
                    {item.caption && <p className="text-[11px] text-slate-400 mt-0.5">{item.caption}</p>}
                  </div>
                </div>
              </div>
            );
          }

          if (item.type === 'audio') {
            const isPlaying = playingAudioId === item.id;
            return (
              <div
                key={item.id}
                className="col-span-1 md:col-span-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-slate-900/80 p-3 flex items-center gap-3 transition-all hover:border-cyan-400/50"
              >
                <button
                  onClick={() => handleToggleAudio(item.id, item.url)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all shadow-md ${
                    isPlaying ? 'bg-cyan-500 shadow-cyan-500/40 animate-pulse' : 'bg-slate-800 hover:bg-cyan-600'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      Emergency Voice Advisory
                    </span>
                    {item.duration && <span className="text-[10px] text-slate-400 font-mono">{item.duration}</span>}
                  </div>
                  <p className="text-xs font-medium text-slate-100 truncate mt-0.5">{item.title}</p>
                  
                  {/* Soundwave animation */}
                  <div className="flex items-center gap-0.5 mt-1.5 h-3">
                    {[40, 70, 30, 90, 60, 100, 50, 80, 40, 60, 90, 30, 70, 50].map((h, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                        }`}
                        style={{ height: isPlaying ? `${h}%` : '20%' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {activeImageModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setActiveImageModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl">
            <img src={activeImageModalUrl} alt="Guidance Graphic" className="max-h-[85vh] w-auto object-contain rounded-lg" />
            <button
              onClick={() => setActiveImageModalUrl(null)}
              className="absolute top-3 right-3 bg-slate-900/80 text-white hover:bg-red-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-700"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
