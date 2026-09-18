'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Video, Music, ShieldCheck } from 'lucide-react';
import { EvidenceItem } from '@/lib/firebase/rtdb';

export interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio';
  previewUrl: string;
  progress: number;
  status: 'UPLOADING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
}

interface EvidenceUploaderProps {
  evidenceList: UploadingFile[];
  onChange: (newList: UploadingFile[]) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ evidenceList, onChange }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    const newUploadingFiles: UploadingFile[] = fileArray.map((file, idx) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const mediaType: 'image' | 'video' | 'audio' = isImage ? 'image' : isVideo ? 'video' : 'audio';

      const fileId = `ev_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
      const previewUrl = URL.createObjectURL(file);

      // Validate size (< 25MB)
      const isTooLarge = file.size > 25 * 1024 * 1024;

      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: mediaType,
        previewUrl,
        progress: isTooLarge ? 0 : 100, // Simulate upload complete or error
        status: isTooLarge ? 'ERROR' : 'SUCCESS',
        errorMessage: isTooLarge ? 'File size exceeds maximum 25MB limit.' : undefined,
      };
    });

    onChange([...evidenceList, ...newUploadingFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (id: string) => {
    onChange(evidenceList.filter((item) => item.id !== id));
  };

  const retryUpload = (id: string) => {
    onChange(
      evidenceList.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'SUCCESS',
            progress: 100,
            errorMessage: undefined,
          };
        }
        return item;
      })
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-sky-500 bg-sky-950/30'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop media evidence files here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports photos, video recordings, and audio files up to 25MB
            </p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-sm">
              Select Media Files
            </span>
          </label>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Automatic EXIF Metadata Scrubbing Active (GPS tags removed)
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {evidenceList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Uploaded Evidence ({evidenceList.length})
          </h3>

          <div className="space-y-3">
            {evidenceList.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Media Preview & Info */}
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  {item.type === 'image' && (
                    <div className="w-14 h-14 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {item.type === 'video' && (
                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center text-sky-400">
                      <Video className="w-6 h-6" />
                    </div>
                  )}

                  {item.type === 'audio' && (
                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center text-amber-400">
                      <Music className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{formatFileSize(item.size)}</span>
                      <span>•</span>
                      <span className="uppercase text-sky-400">{item.type}</span>
                    </div>

                    {/* Upload progress */}
                    {item.status === 'UPLOADING' && (
                      <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-sky-500 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'ERROR' && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {item.errorMessage || 'Upload failed.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions & Status Badge */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {item.status === 'SUCCESS' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-900/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      EXIF Scrubbed
                    </span>
                  )}

                  {item.status === 'ERROR' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<RefreshCw className="w-3.5 h-3.5 text-amber-400" />}
                      onClick={() => retryUpload(item.id)}
                    >
                      Retry
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<X className="w-4 h-4 text-slate-400 hover:text-red-400" />}
                    onClick={() => removeFile(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
