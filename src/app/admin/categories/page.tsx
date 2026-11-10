'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tags,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  ExternalLink,
  Layers,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string;
  itemCount: number;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    sortOrder: 1,
    isActive: true,
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '/images/products/lattafa-blue-oud.webp',
    sortOrder: 1,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload refs
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'add' | 'edit'>('add');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (res.ok && data.success) {
        // Sort explicitly by sortOrder ascending
        const sorted = (data.categories || []).sort((a: CategoryItem, b: CategoryItem) => a.sortOrder - b.sortOrder);
        setCategories(sorted);
        setHasOrderChanged(false);
      } else {
        showToast(data.error || 'Failed to load categories', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error fetching categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Move Category Up in sequence
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nextList = [...categories];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;

    // Recalculate 1-based sortOrder
    const updated = nextList.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setCategories(updated);
    setHasOrderChanged(true);
  };

  // Move Category Down in sequence
  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const nextList = [...categories];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;

    // Recalculate 1-based sortOrder
    const updated = nextList.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));

    setCategories(updated);
    setHasOrderChanged(true);
  };

  // Directly change sortOrder number
  const handleSortOrderInputChange = (id: string, newPosition: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, sortOrder: Math.max(1, newPosition) } : c))
    );
    setHasOrderChanged(true);
  };

  // Save the reordered sequence to the database
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Sort currently in state by sortOrder
      const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      const itemsPayload = sorted.map((c, idx) => ({
        id: c.id,
        sortOrder: idx + 1,
      }));

      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        showToast('Category sequence saved successfully! Storefront updated.');
        setCategories(sorted.map((c, idx) => ({ ...c, sortOrder: idx + 1 })));
        setHasOrderChanged(false);
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving category ordering', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Handle Image Upload to /api/admin/upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        if (isEdit) {
          setEditForm((prev) => ({ ...prev, image: data.url }));
        } else {
          setAddForm((prev) => ({ ...prev, image: data.url }));
        }
        showToast('Image uploaded successfully');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Image upload error', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Open Edit Modal
  const openEditModal = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '/images/products/lattafa-blue-oud.webp',
      sortOrder: cat.sortOrder || 1,
      isActive: cat.isActive !== false,
    });
    setEditModalOpen(true);
  };

  // Save Category Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        showToast(`Category "${editForm.name}" updated successfully.`);
        setEditModalOpen(false);
        fetchCategories();
      } else {
        showToast(data.error || 'Failed to update category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 1;
    setAddForm({
      name: '',
      slug: '',
      description: '',
      image: '/images/products/lattafa-blue-oud.webp',
      sortOrder: nextOrder,
    });
    setAddModalOpen(true);
  };

  // Create New Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        showToast(`Category "${addForm.name}" created successfully.`);
        setAddModalOpen(false);
        fetchCategories();
      } else {
        showToast(data.error || 'Failed to create category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const confirmDelete = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Execute Delete
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        showToast(`Category "${categoryToDelete.name}" deleted successfully.`);
        setDeleteModalOpen(false);
        fetchCategories();
      } else {
        showToast(data.error || 'Failed to delete category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/admin" className="hover:text-stone-900 transition">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-stone-900 transition">
          Products
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-semibold">Categories Management</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-serif italic text-stone-900 font-normal">
            Category Display Order & Hierarchy
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Control which category appears 1st, 2nd, 3rd on the homepage &amp; catalog filter. Edit names, cover photos, or delete categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasOrderChanged && (
            <button
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all animate-pulse"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingOrder ? 'Saving Order...' : 'Save New Sequence'}</span>
            </button>
          )}

          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition"
            title="Refresh categories"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Main Table / List Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-semibold text-stone-600">
          <span>Current Active Categories ({categories.length})</span>
          <span className="text-stone-400 font-normal">Use ↑ / ↓ arrows or position inputs to set 1st, 2nd, 3rd order</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin" />
            <span>Loading categories from atelier database...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <Tags className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-stone-700">No categories found</p>
            <p className="mt-1">Click &ldquo;Add New Category&rdquo; to create your first product category.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/80 transition-colors"
              >
                {/* Left: Position Badge & Reorder Controls */}
                <div className="flex items-center gap-4">
                  {/* Position number indicator */}
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Pos</span>
                    <span className="text-base font-serif font-bold text-[#D45520]">#{cat.sortOrder}</span>
                  </div>

                  {/* Up / Down Arrow buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-700 transition"
                      title="Move up in sequence"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === categories.length - 1}
                      className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-700 transition"
                      title="Move down in sequence"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.image || '/images/products/lattafa-blue-oud.webp'}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/lattafa-blue-oud.webp';
                      }}
                    />
                  </div>

                  {/* Category Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-base font-semibold text-stone-900 truncate">
                        {cat.name}
                      </h3>
                      {cat.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">
                      Slug: /{cat.slug} • {cat.itemCount} Linked Products
                    </p>
                    {cat.description && (
                      <p className="text-xs text-stone-400 mt-1 line-clamp-1 max-w-md">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Manual position input & Actions */}
                <div className="flex items-center gap-3 sm:self-center self-end pt-2 sm:pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span>Rank:</span>
                    <input
                      type="number"
                      min={1}
                      value={cat.sortOrder}
                      onChange={(e) => handleSortOrderInputChange(cat.id, parseInt(e.target.value, 10) || 1)}
                      className="w-14 px-2 py-1 text-center font-bold text-stone-900 border border-stone-300 rounded-lg bg-white focus:outline-none focus:border-[#D45520]"
                    />
                  </div>

                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-[#D45520] transition shadow-xs"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => confirmDelete(cat)}
                    className="p-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition shadow-xs"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    target="_blank"
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-stone-700 transition shadow-xs"
                    title="View in storefront"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info bar */}
        {categories.length > 0 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>
              Tip: The category at position <strong>#1</strong> will always appear first on the homepage &ldquo;Shop by Category&rdquo; and catalog filter.
            </span>
            {hasOrderChanged && (
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition"
              >
                {isSavingOrder ? 'Saving...' : 'Save Sequence Changes'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* EDIT CATEGORY MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Edit Category: {selectedCategory?.name}
                </h3>
                <p className="text-xs text-stone-500">
                  Update category title, display order rank, cover image, and description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Display Sequence Rank *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  placeholder="Atmospheric fragrance description for storefront cards..."
                />
              </div>

              {/* Cover Image Upload / Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-stone-700">
                    Cover Image
                  </label>
                  <span className="text-[10px] text-stone-400">JPG, PNG, WEBP</span>
                </div>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editForm.image || '/images/products/lattafa-blue-oud.webp'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/lattafa-blue-oud.webp';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => editFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D45520]" />
                        <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('edit');
                          setMediaPickerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold shadow-2xs"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-stone-600" />
                        <span>Media Library</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                      placeholder="/images/products/lattafa-blue-oud.webp"
                      className="w-full p-1.5 text-[11px] border border-stone-200 rounded-lg bg-stone-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="font-semibold text-stone-700">Storefront Visibility</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D45520]" />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#D45520] hover:bg-[#BD4616] text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW CATEGORY MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Create New Fragrance Category
                </h3>
                <p className="text-xs text-stone-500">
                  Add a new collection category and specify its storefront ranking position.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setAddForm({ ...addForm, name, slug: autoSlug });
                  }}
                  placeholder="e.g. Rare Attars & Macerations"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.slug}
                    onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Display Sequence Rank *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={addForm.sortOrder}
                    onChange={(e) => setAddForm({ ...addForm, sortOrder: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-stone-900 focus:outline-none focus:border-[#D45520]"
                  placeholder="Artisanal compositions aged in vintage sandalwood..."
                />
              </div>

              {/* Cover Image Upload / Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-stone-700">
                    Category Cover Image
                  </label>
                  <span className="text-[10px] text-stone-400">JPG, PNG, WEBP</span>
                </div>

                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={addForm.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/lattafa-blue-oud.webp';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => addFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D45520]" />
                        <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('add');
                          setMediaPickerOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold shadow-2xs"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-stone-600" />
                        <span>Media Library</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={addForm.image}
                      onChange={(e) => setAddForm({ ...addForm, image: e.target.value })}
                      placeholder="/images/products/lattafa-blue-oud.webp"
                      className="w-full p-1.5 text-[11px] border border-stone-200 rounded-lg bg-stone-50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#D45520] hover:bg-[#BD4616] text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-stone-900">
                Delete Category &ldquo;{categoryToDelete.name}&rdquo;?
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Are you sure you want to delete this category?{' '}
                {categoryToDelete.itemCount > 0 ? (
                  <strong className="text-rose-700 block mt-1">
                    Warning: There are {categoryToDelete.itemCount} products currently assigned to this category. Deleting it will leave those products unassigned (products will not be deleted).
                  </strong>
                ) : (
                  'No products are currently attached to this category.'
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCategory}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs shadow-sm transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          if (mediaPickerTarget === 'edit') {
            setEditForm((prev) => ({ ...prev, image: url }));
          } else {
            setAddForm((prev) => ({ ...prev, image: url }));
          }
        }}
        title="Choose Category Cover Photo"
      />
    </div>
  );
}
