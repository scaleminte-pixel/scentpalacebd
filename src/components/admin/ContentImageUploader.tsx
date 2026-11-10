'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, Link as LinkIcon, CheckCircle, AlertCircle, FolderOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { uploadImageWithProgress, UploadProgressInfo } from '@/lib/upload-client';

interface ContentImageUploaderProps {
  label: string;
  sublabel?: string;
  imageUrl: string;
  onChange: (url: string) => void;
  aspectRatio?: 'hero' | 'banner' | 'square' | 'wide';
}

export default function ContentImageUploader({
  label,
  sublabel,
  imageUrl,
  onChange,
  aspectRatio = 'banner',
}: ContentImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadProgress && ['uploading', 'converting'].includes(uploadProgress.stage);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image (JPEG, PNG, WEBP, AVIF).');
      return;
    }

    setUploadError(null);

    try {
      const res = await uploadImageWithProgress(file, (info) => {
        setUploadProgress(info);
      });

      if (res.success && res.url) {
        onChange(res.url);
      } else {
        setUploadError(res.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network error during upload');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadError(null);
  };

  // Height class based on aspect ratio
  const heightClass =
    aspectRatio === 'hero'
      ? 'h-48'
      : aspectRatio === 'wide'
      ? 'h-40'
      : aspectRatio === 'square'
      ? 'h-44 w-44'
      : 'h-36';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-stone-700 font-semibold text-xs tracking-tight">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-stone-500 mt-0.5">{sublabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMediaPickerOpen(true)}
            className="text-[11px] text-neutral-800 hover:text-[#D45520] font-semibold flex items-center gap-1 cursor-pointer transition px-2 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200"
          >
            <FolderOpen className="w-3 h-3 text-neutral-600" />
            <span>Media Library</span>
          </button>
          <button
            type="button"
            onClick={() => setManualInputOpen(!manualInputOpen)}
            className="text-[11px] text-[#D45520] hover:text-[#B34316] font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{manualInputOpen ? 'Hide URL Box' : 'Enter URL Manually'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Real-time Upload & Conversion Progress Card */}
      {uploadProgress && uploadProgress.stage !== 'idle' && (
        <div className="p-3 bg-[#FAF7F2] border border-[#EAE4DC] rounded-xl space-y-1.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              {uploadProgress.stage === 'uploading' && (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-[#D45520] animate-bounce" />
                  <span className="text-stone-800">Uploading: <strong className="text-[#D45520]">{uploadProgress.percent}%</strong></span>
                </>
              )}
              {uploadProgress.stage === 'converting' && (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-800 font-semibold">Converting & Compressing to WebP...</span>
                </>
              )}
              {uploadProgress.stage === 'done' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-800 font-semibold">
                    Saved {uploadProgress.savedPercent}% ({uploadProgress.originalSizeFormatted} → {uploadProgress.optimizedSizeFormatted})
                  </span>
                </>
              )}
              {uploadProgress.stage === 'error' && (
                <span className="text-rose-600 font-semibold">{uploadProgress.error}</span>
              )}
            </div>
            <span className="font-mono text-[11px] text-stone-500">
              {uploadProgress.stage === 'done' ? '100%' : `${uploadProgress.percent}%`}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 rounded-full ${
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

      {manualInputOpen && (
        <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/images/... or https://..."
              className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#D45520] focus:outline-none"
            />
            {imageUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-stone-400">
            Paste absolute path (e.g. <code>/images/banner-oud-collection.webp</code>) or CDN image URL.
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Main Image Container */}
      {imageUrl ? (
        <div className={`relative ${heightClass} w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 group shadow-xs`}>
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

          {/* Top Info Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/60 text-white backdrop-blur-xs border border-white/20">
              Active Image
            </span>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <div className="truncate max-w-[60%]">
              <span className="text-[10px] font-mono text-stone-300 truncate block">
                {imageUrl}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={Boolean(isUploading)}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition backdrop-blur-xs cursor-pointer hover:scale-102 active:scale-98"
              >
                <RefreshCw className={`w-3 h-3 text-[#D45520] ${isUploading ? 'animate-spin' : ''}`} />
                <span>{isUploading ? 'Uploading...' : 'Replace'}</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-xs transition backdrop-blur-xs cursor-pointer hover:scale-105 active:scale-95"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
            dragOver
              ? 'border-[#D45520] bg-orange-50/50 scale-[1.01]'
              : 'border-stone-300 hover:border-[#D45520] bg-stone-50/60 hover:bg-stone-50'
          }`}
        >
          {isUploading ? (
            <div className="py-3 flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin" />
              <p className="text-xs font-semibold text-stone-700">Uploading image to server...</p>
              <p className="text-[10px] text-stone-400">Optimizing format and generating alt metadata</p>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-[#D45520]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Click to upload or drag and drop
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  High-res WebP, JPG, or PNG (up to 12MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        title={`Choose Asset for ${label}`}
      />
    </div>
  );
}

