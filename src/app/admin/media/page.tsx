'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  X,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { uploadImageWithProgress, UploadProgressInfo } from '@/lib/upload-client';

interface MediaUsage {
  type: 'product' | 'category' | 'section';
  id: string;
  name: string;
}

interface MediaItem {
  url: string;
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  folder: string;
  usedIn: MediaUsage[];
  isUsed: boolean;
}

interface MediaStats {
  totalImages: number;
  totalSizeFormatted: string;
  usedCount: number;
  unusedCount: number;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'used' | 'unused' | 'products' | 'banners'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'smallest'>('newest');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<UploadProgressInfo | null>(null);
  const [overallProgress, setOverallProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Action States
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      if (res.ok && data.success) {
        setMedia(data.media);
        setStats(data.stats);
      } else {
        showToast(data.error || 'Failed to load media assets', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching media', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Image URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    let uploadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setOverallProgress(`Asset ${i + 1} of ${files.length}: ${file.name}`);

      try {
        const res = await uploadImageWithProgress(file, (info) => {
          setCurrentUpload(info);
        });

        if (res.success) {
          uploadedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    setIsUploading(false);
    setTimeout(() => {
      setCurrentUpload(null);
      setOverallProgress(null);
    }, 4000);

    if (uploadedCount > 0) {
      showToast(`Successfully converted & uploaded ${uploadedCount} image(s) to WebP.`);
      fetchMedia();
    }
    if (failedCount > 0) {
      showToast(`Failed to upload ${failedCount} file(s).`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/media?url=${encodeURIComponent(deletingItem.url)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Permanently deleted ${deletingItem.fileName} from disk.`);
        setDeletingItem(null);
        if (previewItem?.url === deletingItem.url) setPreviewItem(null);
        fetchMedia();
      } else {
        showToast(data.error || 'Failed to delete file from disk', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting file', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Logic
  const filteredMedia = media
    .filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.fileName.toLowerCase().includes(q);
        const matchesFolder = item.folder.toLowerCase().includes(q);
        const matchesUsage = item.usedIn.some((u) => u.name.toLowerCase().includes(q));
        if (!matchesName && !matchesFolder && !matchesUsage) return false;
      }

      // Filter tabs
      if (activeFilter === 'used') return item.isUsed;
      if (activeFilter === 'unused') return !item.isUsed;
      if (activeFilter === 'products') return item.folder.includes('products');
      if (activeFilter === 'banners') return item.fileName.includes('banner');

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'largest') return b.sizeBytes - a.sizeBytes;
      if (sortBy === 'smallest') return a.sizeBytes - b.sizeBytes;
      return 0;
    });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium transition-all transform animate-bounce-in ${
            toastMessage.type === 'success'
              ? 'bg-neutral-900 text-white border border-neutral-700'
              : 'bg-red-900 text-white border border-red-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE4DC] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 font-normal">Media Storage & Assets</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-800">
              {stats?.totalImages || 0} Assets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            All assets are permanently stored inside <code className="bg-neutral-200/80 px-1.5 py-0.5 rounded text-neutral-800 font-mono text-[11px]">public/images/</code> so your site stays 100% portable when shared or deployed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMedia}
            disabled={loading}
            className="p-2.5 rounded-xl border border-neutral-300 bg-white text-neutral-700 hover:text-neutral-900 hover:border-neutral-400 transition-colors shadow-2xs"
            title="Refresh Assets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D45520]' : ''}`} />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFileUpload(e.target.files);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow active:scale-98 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload New Assets'}</span>
          </button>
        </div>
      </div>

      {/* Storage Health Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EAE4DC] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Assets</span>
            <FolderOpen className="w-4 h-4 text-[#D45520]" />
          </div>
          <div className="text-2xl font-serif text-neutral-900">{stats?.totalImages || 0}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Saved inside project folder</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE4DC] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Storage Consumed</span>
            <HardDrive className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-serif text-neutral-900">{stats?.totalSizeFormatted || '0 B'}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Total disk footprint</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE4DC] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Store Use</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif text-emerald-700">{stats?.usedCount || 0}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Linked in products & banners</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EAE4DC] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unused / Cleanable</span>
            <Trash2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif text-amber-700">{stats?.unusedCount || 0}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Safe to permanently delete</div>
        </div>
      </div>

      {/* Real-time Upload & Conversion Progress Card */}
      {currentUpload && (
        <div className="p-4 bg-[#FAF7F2] border border-[#EAE4DC] rounded-2xl space-y-2 shadow-xs transition-all animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium">
              {currentUpload.stage === 'uploading' && (
                <>
                  <UploadCloud className="w-4 h-4 text-[#D45520] animate-bounce" />
                  <span className="text-stone-800">
                    {overallProgress || 'Uploading'}: <strong className="text-[#D45520]">{currentUpload.percent}%</strong>
                  </span>
                </>
              )}
              {currentUpload.stage === 'converting' && (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-amber-800 font-semibold">
                    {overallProgress} — Converting & Compressing to WebP...
                  </span>
                </>
              )}
              {currentUpload.stage === 'done' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800 font-semibold">
                    WebP Conversion Complete! Saved {currentUpload.savedPercent}% ({currentUpload.originalSizeFormatted} → {currentUpload.optimizedSizeFormatted})
                  </span>
                </>
              )}
              {currentUpload.stage === 'error' && (
                <span className="text-rose-600 font-semibold">{currentUpload.error}</span>
              )}
            </div>
            <span className="font-mono text-xs text-stone-500">
              {currentUpload.stage === 'done' ? '100%' : `${currentUpload.percent}%`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 rounded-full ${
                currentUpload.stage === 'done'
                  ? 'bg-emerald-600'
                  : currentUpload.stage === 'error'
                  ? 'bg-rose-500'
                  : currentUpload.stage === 'converting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-[#D45520]'
              }`}
              style={{ width: `${currentUpload.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Bulk Uploader Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragOver
            ? 'border-[#D45520] bg-orange-50/50 scale-[1.005]'
            : 'border-[#DCD6CD] hover:border-[#D45520] bg-white/70'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#D45520] flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-medium text-neutral-900">
            {isUploading ? (overallProgress || 'Uploading and converting...') : 'Drag & drop image assets here'}
          </h3>
          <p className="text-xs text-neutral-500">
            Supports JPEG, PNG, WebP, and AVIF up to 15MB each. Every uploaded file is automatically converted & compressed into modern WebP format.
          </p>
        </div>
      </div>

      {/* Filter, Search & Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE4DC] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by file name or usage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#D45520]/20 focus:border-[#D45520] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Assets', count: media.length },
            { id: 'used', label: 'In Store Use', count: stats?.usedCount || 0 },
            { id: 'unused', label: 'Unused / Safe', count: stats?.unusedCount || 0 },
            { id: 'products', label: 'Products' },
            { id: 'banners', label: 'Banners' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeFilter === tab.id ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <span className="text-neutral-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#D45520]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest Size</option>
            <option value="smallest">Smallest Size</option>
          </select>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#EAE4DC] p-16 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#D45520] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-sans">Scanning local media files and cross-referencing database...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE4DC] p-16 text-center space-y-3">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto" />
          <h4 className="text-base font-serif text-neutral-800">No matching assets found</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search keywords or filter tab, or upload new assets directly above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => {
            const isCopied = copiedUrl === item.url;

            return (
              <div
                key={item.url}
                className="group relative bg-white rounded-2xl border border-[#EAE4DC] shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-square w-full bg-[#F4EFEB] overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => setPreviewItem(item)}
                >
                  <Image
                    src={item.url}
                    alt={item.fileName}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                    {item.isUsed ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                        In Use
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                        Unused
                      </span>
                    )}
                  </div>

                  {/* Size Pill */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur-xs pointer-events-none">
                    {item.sizeFormatted}
                  </span>

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="p-2 rounded-xl bg-white text-neutral-800 hover:text-black hover:scale-105 transition-all shadow-md"
                      title="Preview Asset"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item.url);
                      }}
                      className="p-2 rounded-xl bg-white text-neutral-800 hover:text-black hover:scale-105 transition-all shadow-md"
                      title="Copy Public URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingItem(item);
                      }}
                      className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all shadow-md"
                      title="Delete from Disk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata Details Bottom Bar */}
                <div className="p-3 bg-white border-t border-[#EAE4DC]/60 flex flex-col gap-1">
                  <div className="truncate text-xs font-semibold text-neutral-900" title={item.fileName}>
                    {item.fileName}
                  </div>

                  {item.isUsed ? (
                    <div className="truncate text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                      <span>•</span>
                      <span className="truncate">{item.usedIn.map((u) => u.name).join(', ')}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-400">Not linked to store items</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL ASSET PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-700">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#EAE4DC] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-neutral-900 font-medium truncate max-w-md">
                  {previewItem.fileName}
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{previewItem.url}</p>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Stage */}
            <div className="relative flex-1 min-h-[300px] max-h-[460px] bg-[#0E0E0E] flex items-center justify-center p-4 overflow-hidden">
              <Image
                src={previewItem.url}
                alt={previewItem.fileName}
                width={800}
                height={800}
                className="object-contain max-h-[420px] w-auto h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Metadata Footer */}
            <div className="p-5 bg-neutral-50 border-t border-[#EAE4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-neutral-600 space-y-1">
                <div>
                  <span className="font-medium text-neutral-800">File Size:</span> {previewItem.sizeFormatted}
                </div>
                <div>
                  <span className="font-medium text-neutral-800">Status:</span>{' '}
                  {previewItem.isUsed ? (
                    <span className="text-emerald-700 font-semibold">
                      Used in {previewItem.usedIn.map((u) => u.name).join(', ')}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Unused (Safe to remove)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopyUrl(previewItem.url)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    const target = previewItem;
                    setPreviewItem(null);
                    setDeletingItem(target);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-300 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-xl font-medium text-neutral-900">
                Permanently Delete Asset?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-neutral-900">{deletingItem.fileName}</strong>?
                This will physically delete the file from your project disk (<code className="font-mono text-[10px] bg-neutral-100 p-0.5 rounded">{deletingItem.relativePath}</code>).
              </p>
            </div>

            {deletingItem.isUsed && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Warning:</strong> This image is currently linked in{' '}
                  <span className="font-semibold underline">
                    {deletingItem.usedIn.map((u) => u.name).join(', ')}
                  </span>
                  . If you delete this file, the storefront will display a broken image!
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

