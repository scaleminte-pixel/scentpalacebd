'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, X, Check, UploadCloud, Image as ImageIcon, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { uploadImageWithProgress, UploadProgressInfo } from '@/lib/upload-client';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

interface MediaItem {
  url: string;
  fileName: string;
  sizeFormatted: string;
  isUsed: boolean;
}

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Choose Asset from Media Library',
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (res.ok && data.success) {
        setMedia(data.media);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedUrl(null);
      setSearchQuery('');
      setUploadProgress(null);
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadImageWithProgress(file, (info) => {
        setUploadProgress(info);
      });

      if (res.success && res.url) {
        await fetchMedia();
        setSelectedUrl(res.url);
        setTimeout(() => {
          onSelect(res.url);
          onClose();
        }, 1100);
      }
    } catch (err: any) {
      console.error('Upload error in modal:', err);
    }
  };

  if (!isOpen) return null;

  const filtered = media.filter((item) =>
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const isUploading = uploadProgress && ['uploading', 'converting'].includes(uploadProgress.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-300 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE4DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#D45520] flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg text-neutral-900 font-medium">
                {title}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Select an existing asset from disk or upload a new one directly (auto-converts to WebP).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Upload & Conversion Banner */}
        {uploadProgress && uploadProgress.stage !== 'idle' && (
          <div className="px-5 py-3 border-b border-[#EAE4DC] bg-[#FAF7F2] transition-all">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 font-medium">
                {uploadProgress.stage === 'uploading' && (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#D45520] animate-bounce" />
                    <span className="text-stone-800">Uploading {uploadProgress.fileName}: <strong className="text-[#D45520]">{uploadProgress.percent}%</strong></span>
                  </>
                )}
                {uploadProgress.stage === 'converting' && (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-amber-800 font-semibold">Converting & Compressing to WebP...</span>
                  </>
                )}
                {uploadProgress.stage === 'done' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800 font-semibold">
                      WebP Conversion Complete! Saved {uploadProgress.savedPercent}% ({uploadProgress.originalSizeFormatted} → {uploadProgress.optimizedSizeFormatted})
                    </span>
                  </>
                )}
                {uploadProgress.stage === 'error' && (
                  <span className="text-rose-600 font-semibold">Upload failed: {uploadProgress.error}</span>
                )}
              </div>
              <span className="font-mono text-[11px] text-stone-500">
                {uploadProgress.stage === 'done' ? '100%' : `${uploadProgress.percent}%`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  uploadProgress.stage === 'done'
                    ? 'bg-emerald-600'
                    : uploadProgress.stage === 'error'
                    ? 'bg-rose-500'
                    : uploadProgress.stage === 'converting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-[#D45520]'
                }`}
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Search & Upload Bar */}
        <div className="p-4 bg-neutral-50 border-b border-[#EAE4DC] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#D45520]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchMedia}
              disabled={loading}
              className="p-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D45520]' : ''}`} />
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
              <UploadCloud className="w-3.5 h-3.5 text-orange-400" />
              <span>{isUploading ? `${uploadProgress?.percent || 0}% Uploading...` : 'Upload & Convert to WebP'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                onChange={handleFileUpload}
                disabled={Boolean(isUploading)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[50vh]">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              <div className="w-8 h-8 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading media assets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
              <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto" />
              <p>No matching images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const isSelected = selectedUrl === item.url;

                return (
                  <div
                    key={item.url}
                    onClick={() => setSelectedUrl(item.url)}
                    onDoubleClick={() => {
                      onSelect(item.url);
                      onClose();
                    }}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer aspect-square bg-[#F4EFEB] transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D45520] ring-2 ring-[#D45520]/30 shadow-md'
                        : 'border-[#EAE4DC] hover:border-neutral-400'
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.fileName}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />

                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D45520] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1 text-white truncate text-[9px] font-mono">
                      {item.fileName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EAE4DC] flex items-center justify-between bg-neutral-50">
          <div className="text-xs text-neutral-500 truncate max-w-sm">
            {selectedUrl ? (
              <span className="font-mono text-neutral-800">Selected: {selectedUrl.split('/').pop()}</span>
            ) : (
              <span>Click an image to select, or double-click to choose immediately.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedUrl}
              onClick={() => {
                if (selectedUrl) {
                  onSelect(selectedUrl);
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#D45520] hover:bg-[#BD4616] disabled:opacity-40 text-xs font-semibold text-white shadow-xs cursor-pointer"
            >
              Select Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
