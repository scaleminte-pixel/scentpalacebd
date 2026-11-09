'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  DollarSign,
  Package,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  Upload,
  RefreshCw,
  X,
  Star,
  Info,
  Tag,
  Truck,
  Droplets,
  Clock,
  Wind,
  ShieldCheck,
  Check,
  FolderOpen,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { uploadImageWithProgress, UploadProgressInfo } from '@/lib/upload-client';

interface ProductImageItem {
  url: string;
  alt: string;
}

interface VariantItem {
  id?: string;
  size: string;
  sku: string;
  purchaseCost: number;
  sellingPrice: number;
  originalPrice?: number;
  stock: number;
  lowStockThreshold: number;
}

interface Props {
  initialData?: any;
  isEdit?: boolean;
}

export const ProductForm: React.FC<Props> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugCustomized, setIsSlugCustomized] = useState(Boolean(initialData?.slug));
  const [concentration, setConcentration] = useState(initialData?.concentration || 'Extrait de Parfum');
  const [tagline, setTagline] = useState(initialData?.tagline || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [story, setStory] = useState(initialData?.story || '');
  const [categoryName, setCategoryName] = useState(initialData?.category?.name || 'Unisex');
  const [scentFamilyName, setScentFamilyName] = useState(initialData?.scentFamily?.name || 'Oud & Woody');

  // Categories list & New Category modal
  const [categories, setCategories] = useState<any[]>([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('/images/products/oud-ambre.webp');
  const [catImageUploading, setCatImageUploading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // Images with Alt Tags
  const [images, setImages] = useState<ProductImageItem[]>(() => {
    if (initialData?.imageObjects && Array.isArray(initialData.imageObjects) && initialData.imageObjects.length > 0) {
      return initialData.imageObjects.map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: img.alt || initialData.name || 'Rāwdah Luxury Fragrance',
      }));
    }
    if (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
      return initialData.images.map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: initialData.name || 'Rāwdah Luxury Fragrance',
      }));
    }
    return [
      {
        url: '/images/products/oud-ambre.webp',
        alt: 'Oud Ambre 50ml Sovereign Extrait Flacon',
      },
    ];
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Olfactory Pyramid (Scent Notes)
  const [notesTop, setNotesTop] = useState<string[]>(
    initialData?.notesTop || ['Calabrian Bergamot', 'Cardamom Pods']
  );
  const [notesHeart, setNotesHeart] = useState<string[]>(
    initialData?.notesHeart || ['Cambodian Oud', 'Bourbon Vanilla']
  );
  const [notesBase, setNotesBase] = useState<string[]>(
    initialData?.notesBase || ['Smoked Birch', 'Golden Ambergris']
  );

  const [topInput, setTopInput] = useState('');
  const [heartInput, setHeartInput] = useState('');
  const [baseInput, setBaseInput] = useState('');

  // Performance & Formulation
  const [longevity, setLongevity] = useState(initialData?.longevity || '14-18 Hours');
  const [sillage, setSillage] = useState(initialData?.sillage || 'Regal & Enveloping');
  const [bestSeason, setBestSeason] = useState(initialData?.bestSeason || 'Autumn / Winter');
  const [ingredients, setIngredients] = useState<string[]>(
    initialData?.ingredients || ['Alcohol Denat.', 'Parfum (Fragrance)', 'Aquilaria Agallocha Wood Oil']
  );
  const [ingredientInput, setIngredientInput] = useState('');

  // Selling Type & Inventory (Matching Demo 1 & 2)
  const [isOnlineSelling, setIsOnlineSelling] = useState(true);
  const [isInStoreSelling, setIsInStoreSelling] = useState(true);
  const [manageStock, setManageStock] = useState(true);
  const [alertQuantity, setAlertQuantity] = useState(5);

  // Shipping & Dimensions (Matching Demo 1)
  const [itemWeightKg, setItemWeightKg] = useState('0.45');
  const [packageLength, setPackageLength] = useState('12.00');
  const [packageBreadth, setPackageBreadth] = useState('12.00');
  const [packageWidth, setPackageWidth] = useState('12.00');

  // Merchandising Badges
  const [isBestSeller, setIsBestSeller] = useState(Boolean(initialData?.isBestSeller));
  const [isNewArrival, setIsNewArrival] = useState(Boolean(initialData?.isNewArrival));
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [status, setStatus] = useState(initialData?.status || 'PUBLISHED');

  // Flacon Variants
  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants.map((v: any) => ({
          id: v.id,
          size: v.size || '50ml',
          sku: v.sku || 'RDH-50',
          purchaseCost: Number(v.purchaseCost) || 4500,
          sellingPrice: Number(v.sellingPrice) || 12500,
          originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
          stock: Number(v.stock) || 15,
          lowStockThreshold: Number(v.lowStockThreshold) || 5,
        }))
      : [
          {
            size: '50ml',
            sku: 'RDH-50',
            purchaseCost: 4500,
            sellingPrice: 12500,
            originalPrice: 14000,
            stock: 15,
            lowStockThreshold: 5,
          },
          {
            size: '100ml',
            sku: 'RDH-100',
            purchaseCost: 6500,
            sellingPrice: 17500,
            originalPrice: 19500,
            stock: 10,
            lowStockThreshold: 5,
          },
        ]
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch categories
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // 2. Automatic URL Slug Generator from Product Name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustomized || !isEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugCustomized(true);
    setSlug(
      e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '')
    );
  };

  // Image Upload Handler (Real File to /api/admin/upload with Progress & WebP Auto-Conversion)
  const isUploading = uploadProgress && ['uploading', 'converting'].includes(uploadProgress.stage);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await uploadImageWithProgress(file, (info) => {
        setUploadProgress(info);
      });

      if (data.success) {
        const newImgItem: ProductImageItem = {
          url: data.url,
          alt: `${name || 'Rāwdah Fragrance'} - ${data.alt}`,
        };

        if (replaceIndexRef.current !== null) {
          const updated = [...images];
          updated[replaceIndexRef.current] = newImgItem;
          setImages(updated);
          replaceIndexRef.current = null;
        } else {
          setImages([...images, newImgItem]);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadProgress(null), 4000);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages([
        ...images,
        {
          url: imageUrlInput.trim(),
          alt: imageAltInput.trim() || `${name || 'Rāwdah Fragrance'} Flacon`,
        },
      ]);
      setImageUrlInput('');
      setImageAltInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert('A luxury fragrance must have at least one flacon presentation image.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAltChange = (index: number, newAlt: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], alt: newAlt };
    setImages(updated);
  };

  const handleTriggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    fileInputRef.current?.click();
  };

  // Variant Management
  const handleAddVariant = () => {
    const nextSize = variants.length === 2 ? '200ml' : `${variants.length * 50 + 50}ml`;
    const cleanPrefix = slug ? slug.toUpperCase().slice(0, 3) : 'FLC';
    setVariants([
      ...variants,
      {
        size: nextSize,
        sku: `RDH-${cleanPrefix}-${variants.length + 1}`,
        purchaseCost: 8500,
        sellingPrice: 24500,
        originalPrice: 28000,
        stock: 8,
        lowStockThreshold: 4,
      },
    ]);
  };

  const handleVariantChange = (index: number, field: keyof VariantItem, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('A product must contain at least one flacon size variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Note Helpers
  const addTopNote = () => {
    if (topInput.trim()) {
      setNotesTop([...notesTop, topInput.trim()]);
      setTopInput('');
    }
  };
  const addHeartNote = () => {
    if (heartInput.trim()) {
      setNotesHeart([...notesHeart, heartInput.trim()]);
      setHeartInput('');
    }
  };
  const addBaseNote = () => {
    if (baseInput.trim()) {
      setNotesBase([...notesBase, baseInput.trim()]);
      setBaseInput('');
    }
  };
  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  // Category Image Upload (Direct file to /api/admin/upload)
  const handleCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setCatImageUploading(true);

    try {
      const data = await uploadImageWithProgress(file, () => {});
      if (data.success && data.url) {
        setNewCatImage(data.url);
      } else {
        alert(data.error || 'Failed to upload category image');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setCatImageUploading(false);
      if (catFileInputRef.current) catFileInputRef.current.value = '';
    }
  };

  // Create Category Modal Action
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          image: newCatImage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCategories([...categories, data.category]);
        setCategoryName(data.category.name);
        setIsCatModalOpen(false);
        setNewCatName('');
        setNewCatDesc('');
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating category');
    } finally {
      setCatLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Save image objects with both URL and Alt tag
    const formattedImages = images.map((img) => ({
      url: img.url,
      alt: img.alt || `${name} Flacon`,
    }));

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      concentration,
      tagline,
      description,
      story,
      categoryName,
      scentFamilyName,
      images: formattedImages,
      notesTop,
      notesHeart,
      notesBase,
      longevity,
      sillage,
      bestSeason,
      ingredients,
      isBestSeller,
      isNewArrival,
      isFeatured,
      status,
      variants,
    };

    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: isEdit ? `"${name}" updated successfully!` : `"${name}" published live to the collection!`,
        });
        setTimeout(() => {
          router.push('/admin/products');
        }, 1200);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save fragrance.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Connection error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Hidden File Input for Image Uploading & Replacing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
      />

      {/* =========================================================================
          TOP NAV & ACTIONS (Matching Demo 1)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors shadow-xs"
            title="Back to product list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] text-stone-400 block font-medium">Back to product list</span>
            <h1 className="text-2xl font-bold text-stone-900">
              {isEdit ? `Edit: ${name || initialData?.name}` : 'Add New Product'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/shop"
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition flex items-center gap-1.5"
          >
            <span>View Shop</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>

          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
          >
            Discard
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D45520] hover:bg-[#B34316] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Add Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* =========================================================================
          TWO-COLUMN MAIN CONTENT (Strictly matching Demo 1 & Demo 2)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT COLUMN (7 COLS) ==================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Description & Automatic URL Generation */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
              Description & URL
            </h3>

            {/* Product Name with Auto Slug */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Oud Imperial Royale"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />

              {/* Automatic URL Slug Preview Pill */}
              <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px] truncate">
                  <span className="text-[#D45520] font-semibold">Storefront URL:</span>
                  <span className="truncate">/product/{slug || 'your-product-name'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-stone-400 font-sans">Slug:</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    className="px-2 py-1 text-[11px] font-mono bg-white border border-stone-200 rounded-lg w-36 text-stone-800"
                    placeholder="slug"
                  />
                </div>
              </div>
            </div>

            {/* Tagline / Luxury One-Liner */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Luxury Tagline / Highlight
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Warm golden amber enrobed in aged Cambodian agarwood and royal musk."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>

            {/* Business Description / Scent Story */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">
                  Business Description & Heritage Narrative
                </label>
                <span className="text-[10px] text-stone-400">Rich fragrance details</span>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="An opulent tapestry of rich oriental nuances. Oud Ambre fuses radiant sun-warmed amber with twenty-year aged agarwood, anchored by a velvety base of cashmere musk and tonka bean."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>

            {/* Poetic Heritage Story */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Poetic Origin & Inspiration Story (Optional)
              </label>
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Distilled under the desert stars, this fragrance represents the crown jewel of Rāwdah Haute Parfumerie..."
                className="w-full p-3 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
          </div>

          {/* Card 2: Category & Scent Family (Matching Demo 1 & 2) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-base font-bold text-stone-900">
                Category & Classification
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D45520]" />
                <span>Add New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Category *
                </label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-stone-50 focus:bg-white"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.itemCount || 0} items)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Gift Sets">Gift Sets</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Scent Family *
                </label>
                <select
                  value={scentFamilyName}
                  onChange={(e) => setScentFamilyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-stone-50 focus:bg-white"
                >
                  <option value="Oud & Woody">Oud & Woody</option>
                  <option value="Amber & Spicy">Amber & Spicy</option>
                  <option value="Floral">Floral & Rose</option>
                  <option value="Fresh & Citrus">Fresh & Citrus</option>
                  <option value="Leather & Oriental">Leather & Oriental</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Perfume Olfactory Pyramid (Scent Notes - Rāwdah Signature) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
              Olfactory Pyramid & Scent Notes
            </h3>

            {/* Top Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Top Notes (The Opening • First 30 Mins)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {notesTop.map((n, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs"
                  >
                    <span>{n}</span>
                    <button
                      type="button"
                      onClick={() => setNotesTop(notesTop.filter((_, idx) => idx !== i))}
                      className="text-amber-600 hover:text-amber-900 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topInput}
                  onChange={(e) => setTopInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopNote())}
                  placeholder="e.g. Golden Amber, Cardamom Pods"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                />
                <button
                  type="button"
                  onClick={addTopNote}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 rounded-xl"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Heart Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Heart Notes (The Core • 2 – 6 Hours)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {notesHeart.map((n, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-900 rounded-lg text-xs"
                  >
                    <span>{n}</span>
                    <button
                      type="button"
                      onClick={() => setNotesHeart(notesHeart.filter((_, idx) => idx !== i))}
                      className="text-stone-500 hover:text-stone-900 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heartInput}
                  onChange={(e) => setHeartInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHeartNote())}
                  placeholder="e.g. Cambodian Oud, Bourbon Vanilla"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                />
                <button
                  type="button"
                  onClick={addHeartNote}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 rounded-xl"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Base Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Base Notes (The Sillage Trail • 8 – 18+ Hours)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {notesBase.map((n, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs"
                  >
                    <span>{n}</span>
                    <button
                      type="button"
                      onClick={() => setNotesBase(notesBase.filter((_, idx) => idx !== i))}
                      className="text-amber-600 hover:text-amber-900 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={baseInput}
                  onChange={(e) => setBaseInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBaseNote())}
                  placeholder="e.g. Velvet Musk, Smoked Birch"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200"
                />
                <button
                  type="button"
                  onClick={addBaseNote}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 rounded-xl"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Formulation Tier & Performance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Concentration Tier
                </label>
                <select
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  className="w-full p-2 text-xs border border-stone-200 rounded-lg bg-stone-50"
                >
                  <option value="Extrait de Parfum">Extrait de Parfum (30% Oil)</option>
                  <option value="Eau de Parfum Intense">Eau de Parfum Intense (20%)</option>
                  <option value="Pure Perfume Oil">Pure Perfume Oil & Attar</option>
                  <option value="Luxury Presentation Set">Discovery Set Coffret</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Longevity Rating
                </label>
                <input
                  type="text"
                  value={longevity}
                  onChange={(e) => setLongevity(e.target.value)}
                  placeholder="14-18 Hours"
                  className="w-full p-2 text-xs border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Sillage Trail
                </label>
                <input
                  type="text"
                  value={sillage}
                  onChange={(e) => setSillage(e.target.value)}
                  placeholder="Enveloping & Heavy"
                  className="w-full p-2 text-xs border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Selling Type & Inventory Settings (Matching Demo 1 & 2) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
              Selling Channels & Inventory
            </h3>

            {/* Selling Type Radios/Checkboxes matching Demo 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700">Selling Channels</label>
              <div className="flex flex-wrap gap-4 text-xs text-stone-800">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnlineSelling}
                    onChange={(e) => setIsOnlineSelling(e.target.checked)}
                    className="accent-[#D45520] w-4 h-4 rounded"
                  />
                  <span>Online Store (rawdahperfumes.com)</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInStoreSelling}
                    onChange={(e) => setIsInStoreSelling(e.target.checked)}
                    className="accent-[#D45520] w-4 h-4 rounded"
                  />
                  <span>In-store Gulshan Atelier Tasting</span>
                </label>
              </div>
            </div>

            {/* Manage Stock Toggle matching Demo 2 */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-800 block">Manage Stock Levels</span>
                <span className="text-[11px] text-stone-400">Track physical inventory & trigger low stock alerts</span>
              </div>
              <input
                type="checkbox"
                checked={manageStock}
                onChange={(e) => setManageStock(e.target.checked)}
                className="accent-[#D45520] w-4 h-4 rounded"
              />
            </div>
          </div>

          {/* Card 5: Flacon Variants & Pricing (Matching Demo 1) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Flacon Variants & Pricing
                </h3>
                <p className="text-[11px] text-stone-400">
                  Define size options, SKUs, and retail prices in BDT.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D45520] text-white hover:bg-[#B34316] rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Variant</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-stone-800">
                      Variant #{idx + 1} — {v.size} Flacon
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-lg"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Flacon Size
                      </label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                        placeholder="50ml"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Variant SKU
                      </label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                        placeholder="RDH-50"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg font-mono text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Selling Price (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        value={v.sellingPrice}
                        onChange={(e) => handleVariantChange(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Compare Price (৳)
                      </label>
                      <input
                        type="number"
                        value={v.originalPrice || ''}
                        onChange={(e) =>
                          handleVariantChange(idx, 'originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        placeholder="Strike-through"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-stone-200/60">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                        Physical Stock
                      </label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg font-bold text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                        Low Stock Alert
                      </label>
                      <input
                        type="number"
                        value={v.lowStockThreshold}
                        onChange={(e) =>
                          handleVariantChange(idx, 'lowStockThreshold', parseInt(e.target.value, 10) || 5)
                        }
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-stone-500 mb-1">
                        Production Cost (৳)
                      </label>
                      <input
                        type="number"
                        value={v.purchaseCost}
                        onChange={(e) => handleVariantChange(idx, 'purchaseCost', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN (5 COLS) ==================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Product Images & SEO Alt Tags (Matching Demo 1 & 2) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="text-base font-bold text-stone-900">
                Product Images & Alt Tags
              </h3>
              <span className="text-[10px] text-stone-400">SEO & Visuals</span>
            </div>

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

            {/* Upload File or Pick from Media Library */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => {
                  replaceIndexRef.current = null;
                  fileInputRef.current?.click();
                }}
                className="border-2 border-dashed border-stone-300 hover:border-[#D45520] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-stone-50/70 hover:bg-white group flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-[#D45520]/10 text-[#D45520] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-stone-800">
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">Computer file</p>
              </div>

              <div
                onClick={() => {
                  replaceIndexRef.current = null;
                  setMediaPickerOpen(true);
                }}
                className="border-2 border-dashed border-stone-300 hover:border-[#D45520] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-stone-50/70 hover:bg-white group flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-4 h-4 text-[#D45520]" />
                </div>
                <p className="text-xs font-semibold text-stone-800">Media Library</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Choose from disk</p>
              </div>
            </div>

            {/* Or Paste Direct Image URL */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-stone-700 block">
                Or Add Image via URL:
              </span>
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="/images/products/oud-ambre.jpg"
                className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  placeholder="Alt tag for SEO..."
                  className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-[#D45520] text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Uploaded Images List with Preview, Replace, Remove, Alt Tag (Matching Demo 1) */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-semibold text-stone-700">
                Uploaded Gallery ({images.length})
              </label>

              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-start gap-3"
                >
                  <div className="relative w-16 h-16 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0">
                    <Image
                      src={img.url}
                      alt={img.alt || 'Product thumbnail'}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-stone-900 text-white text-[8px] text-center font-bold uppercase py-0.5">
                        Cover
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-stone-400 truncate max-w-[140px]">
                        {img.url}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTriggerReplace(idx)}
                          className="px-2 py-0.5 rounded bg-white border border-stone-200 text-[10px] font-semibold text-stone-700 hover:bg-stone-100"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="text-stone-400 hover:text-rose-600 p-0.5"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Alt Tag Input (Requested by user) */}
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-stone-500 mb-0.5">
                        SEO Alt Tag (Accessibility)
                      </label>
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => handleAltChange(idx, e.target.value)}
                        placeholder="Image description..."
                        className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-[11px] text-stone-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Shipping and Delivery (Matching Demo 1) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
              Shipping & Delivery
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Items Weight
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={itemWeightKg}
                  onChange={(e) => setItemWeightKg(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-800"
                />
                <span className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-semibold text-stone-600">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Package Size (L × B × W)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-stone-400 block mb-0.5">Length</span>
                  <input
                    type="text"
                    value={packageLength}
                    onChange={(e) => setPackageLength(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block mb-0.5">Breadth</span>
                  <input
                    type="text"
                    value={packageBreadth}
                    onChange={(e) => setPackageBreadth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block mb-0.5">Width</span>
                  <input
                    type="text"
                    value={packageWidth}
                    onChange={(e) => setPackageWidth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Merchandising Badges & Publication Status */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
              Merchandising & Status
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 bg-stone-50"
              >
                <option value="PUBLISHED">PUBLISHED (Live on Storefront)</option>
                <option value="DRAFT">DRAFT (Hidden from Public)</option>
                <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
              </select>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-stone-100 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="accent-[#D45520] w-4 h-4 rounded"
                />
                <span className="font-medium text-stone-800">Best Seller Masterpiece</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="accent-[#D45520] w-4 h-4 rounded"
                />
                <span className="font-medium text-stone-800">New Seasonal Arrival</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="accent-[#D45520] w-4 h-4 rounded"
                />
                <span className="font-medium text-stone-800">Featured in Atelier Carousel</span>
              </label>
            </div>

            {/* Review Management Shortcut if in Edit mode */}
            {isEdit && (
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{initialData.rating || 5.0}</span>
                  <span className="text-stone-400">({initialData.reviewsCount || 0} reviews)</span>
                </div>
                <Link
                  href="/admin/reviews"
                  className="text-xs font-semibold text-[#D45520] hover:underline"
                >
                  Manage Reviews →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ADD NEW CATEGORY MODAL (Requested by user)
         ========================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Add New Category
                </h3>
                <p className="text-xs text-stone-500">
                  Instantly creates and links a new category for products.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Pure Attars & Oils"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Category Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Pure concentrated attars macerated in vintage sandalwood..."
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-stone-700">
                    Category Image (Upload or URL)
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">Supports JPG, PNG, WEBP</span>
                </div>

                <input
                  ref={catFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCatImageUpload}
                  className="hidden"
                />

                {newCatImage ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-stone-200 bg-stone-50">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newCatImage}
                        alt="Category Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {newCatImage.split('/').pop()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        <span>Uploaded & Ready</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => catFileInputRef.current?.click()}
                        disabled={catImageUploading}
                        className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-[11px] font-semibold hover:bg-stone-100 disabled:opacity-50"
                      >
                        {catImageUploading ? 'Uploading...' : 'Change'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatImage('')}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => catFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 hover:border-[#D45520] hover:bg-[#FAF7F2] rounded-2xl p-4 text-center cursor-pointer transition-colors"
                  >
                    {catImageUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-5 h-5 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-stone-600 font-medium">Uploading category image...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload className="w-5 h-5 text-stone-400" />
                        <span className="text-xs font-bold text-stone-700">Click to upload image file</span>
                        <span className="text-[10px] text-stone-400">or browse from your computer</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional manual URL input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    placeholder="Or paste image URL (e.g. /images/products/oud-ambre.jpg)"
                    className="w-full p-2 border border-stone-200 rounded-xl bg-white font-mono text-[11px] text-stone-700 placeholder:text-stone-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={catLoading || !newCatName.trim()}
                className="px-4 py-2 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {catLoading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => {
          setMediaPickerOpen(false);
          replaceIndexRef.current = null;
        }}
        onSelect={(url) => {
          const newImgItem = {
            url,
            alt: `${name || 'Rawdah Fragrance'} Flacon`,
          };
          if (replaceIndexRef.current !== null) {
            const updated = [...images];
            updated[replaceIndexRef.current] = newImgItem;
            setImages(updated);
            replaceIndexRef.current = null;
          } else {
            setImages([...images, newImgItem]);
          }
        }}
        title="Choose Fragrance Presentation Image"
      />
    </form>
  );
};
