'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentImageUploader from '@/components/admin/ContentImageUploader';
import {
  Layout,
  Eye,
  EyeOff,
  Sparkles,
  Edit3,
  Save,
  X,
  CheckCircle,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Tag,
  HelpCircle,
  Sliders,
  Compass,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function AdminContentPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'banners' | 'editorial' | 'promos'>('all');
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Dedicated Form State for Visual Fields
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    animationPreset: 'LUXURY_EASE',
    isVisible: true,

    // Hero Section
    headlineLine1: '',
    headlineLine2: '',
    heroSubtitle: '',
    watermarkText: '',
    badgeText: '',
    heroButtonText: '',
    heroButtonLink: '',
    heroImageUrl: '',

    // Announcement Bar
    announcementText: '',
    highlightCode: '',
    announcementLink: '',

    // Editorial Intro
    headingLine1: '',
    headingLine2: '',
    editorialBody: '',
    signatureTitle: '',
    signatureSubtitle: '',

    // Banners (Collection & Gift Sets)
    bannerTagline: '',
    bannerTitle: '',
    bannerDescription: '',
    bannerCtaText: '',
    bannerCtaLink: '',
    bannerImageUrl: '',

    // FAQ Section
    faqTitle: '',
    faqSubtitle: '',
    faqItems: [] as { q: string; a: string }[],

    // Welcome Promo Modal
    promoEnabled: true,
    discountPercentage: 15,
    couponCode: 'WELCOME15',
    promoTagline: 'CELEBRATE YOUR SIGNATURE SCENT',
    promoTitle: 'Complimentary 15% Privilege',
    promoSubtitle: 'Step into the sovereign world of Scent Palace BD with an exclusive welcome privilege.',
    promoPerks: [
      '15% instant reduction on any extrait or coffret',
      'Two complimentary 2ml luxury extrait samples included',
      'Free express delivery nationwide across Bangladesh',
    ],
    promoButtonText: 'Claim 15% Privilege & Shop',
    promoFloatingPill: 'Special 15% Off Privilege',
    promoImageUrl: '/images/products/lattafa-khamrah.webp',

    // Generic fallback for any other sections
    genericFields: {} as Record<string, any>,
  });

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleToggleVisibility = async (section: any) => {
    try {
      const res = await fetch(`/api/admin/content/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      });
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, isVisible: !s.isVisible } : s))
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        fetch('/api/admin/clear-cache', { method: 'POST' }).catch(() => {});
        setSaveSuccess(`Visibility updated for "${section.title}"`);
        setTimeout(() => setSaveSuccess(null), 2500);
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const handleEditOpen = (section: any) => {
    setEditingSection(section);
    const c = section.content || {};

    setForm({
      title: section.title || '',
      subtitle: section.subtitle || '',
      animationPreset: section.animationPreset || 'LUXURY_EASE',
      isVisible: section.isVisible !== undefined ? section.isVisible : true,

      // Hero
      headlineLine1: c.headlineLine1 || c.heading || 'A Signature Scent,',
      headlineLine2: c.headlineLine2 || 'Crafted with Soul',
      heroSubtitle: c.subtitle || c.description || '',
      watermarkText: c.watermarkText || 'SCENT THAT LINGERS',
      badgeText: c.badgeText || 'LONG LASTING',
      heroButtonText: c.buttonText || c.ctaText || 'Discover Fragrance',
      heroButtonLink: c.buttonLink || c.ctaLink || '/shop',
      heroImageUrl: c.imageUrl || c.bgImage || '/images/banner-oud-collection.webp',

      // Announcement
      announcementText: c.text || '',
      highlightCode: c.highlightCode || '',
      announcementLink: c.linkUrl || c.linkText || '/shop',

      // Editorial
      headingLine1: c.headingLine1 || 'Luxury,',
      headingLine2: c.headingLine2 || 'No Compromise.',
      editorialBody: c.body || '',
      signatureTitle: c.signatureTitle || 'Our Signature Scents (18)',
      signatureSubtitle: c.signatureSubtitle || 'Explore our collection of refined fragrances...',

      // Banners
      bannerTagline: c.tagline || section.subtitle || '',
      bannerTitle: c.title || c.heading || section.title || '',
      bannerDescription: c.description || '',
      bannerCtaText: c.ctaText || 'Explore Collection',
      bannerCtaLink: c.ctaLink || '/shop',
      bannerImageUrl: c.imageUrl || c.bgImage || '',

      // FAQ
      faqTitle: c.title || c.heading || 'Frequently asked questions',
      faqSubtitle: c.subtitle || c.description || '',
      faqItems: Array.isArray(c.items) ? [...c.items] : [],

      // Welcome Promo
      promoEnabled: c.enabled !== false,
      discountPercentage: Number(c.discountPercentage || 15),
      couponCode: c.couponCode || 'WELCOME15',
      promoTagline: c.tagline || 'CELEBRATE YOUR SIGNATURE SCENT',
      promoTitle: c.title || 'Complimentary 15% Privilege',
      promoSubtitle: c.subtitle || '',
      promoPerks: Array.isArray(c.perks) ? [...c.perks] : [
        '15% instant reduction on any extrait or coffret',
        'Two complimentary 2ml luxury extrait samples included',
        'Free express delivery nationwide across Bangladesh',
      ],
      promoButtonText: c.buttonText || 'Claim 15% Privilege & Shop',
      promoFloatingPill: c.floatingPillText || 'Special 15% Off Privilege',
      promoImageUrl: c.imageUrl || c.image || '/images/products/lattafa-khamrah.webp',

      genericFields: { ...c },
    });
  };

  const handleAddFaqItem = () => {
    setForm((prev) => ({
      ...prev,
      faqItems: [...prev.faqItems, { q: 'New Question Title', a: 'Detailed answer explanation...' }],
    }));
  };

  const handleRemoveFaqItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      faqItems: prev.faqItems.filter((_, idx) => idx !== index),
    }));
  };

  const handleFaqChange = (index: number, field: 'q' | 'a', value: string) => {
    setForm((prev) => {
      const updated = [...prev.faqItems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqItems: updated };
    });
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    setIsSaving(true);

    let updatedContent: Record<string, any> = {};
    const key = editingSection.sectionKey;

    if (key === 'hero') {
      updatedContent = {
        headlineLine1: form.headlineLine1,
        headlineLine2: form.headlineLine2,
        subtitle: form.heroSubtitle,
        description: form.heroSubtitle,
        heading: `${form.headlineLine1} ${form.headlineLine2}`.trim(),
        watermarkText: form.watermarkText,
        badgeText: form.badgeText,
        buttonText: form.heroButtonText,
        ctaText: form.heroButtonText,
        buttonLink: form.heroButtonLink,
        ctaLink: form.heroButtonLink,
        imageUrl: form.heroImageUrl,
        bgImage: form.heroImageUrl,
      };
    } else if (key === 'announcement') {
      updatedContent = {
        text: form.announcementText,
        highlightCode: form.highlightCode,
        linkUrl: form.announcementLink,
      };
    } else if (key === 'editorial') {
      updatedContent = {
        headingLine1: form.headingLine1,
        headingLine2: form.headingLine2,
        body: form.editorialBody,
        signatureTitle: form.signatureTitle,
        signatureSubtitle: form.signatureSubtitle,
        amberTitle: 'Warm Golden Amber',
        saffronTitle: 'Kashmiri Dawn Saffron',
      };
    } else if (key === 'collection_banner' || key === 'gift_sets_banner') {
      updatedContent = {
        tagline: form.bannerTagline,
        title: form.bannerTitle,
        heading: form.bannerTitle,
        description: form.bannerDescription,
        ctaText: form.bannerCtaText,
        ctaLink: form.bannerCtaLink,
        imageUrl: form.bannerImageUrl,
        bgImage: form.bannerImageUrl,
      };
    } else if (key === 'faq') {
      updatedContent = {
        title: form.faqTitle,
        subtitle: form.faqSubtitle,
        heading: form.faqTitle,
        description: form.faqSubtitle,
        items: form.faqItems,
      };
    } else if (key === 'welcome_promo') {
      updatedContent = {
        enabled: form.promoEnabled,
        discountPercentage: Number(form.discountPercentage),
        couponCode: form.couponCode,
        tagline: form.promoTagline,
        title: form.promoTitle,
        subtitle: form.promoSubtitle,
        perks: form.promoPerks,
        buttonText: form.promoButtonText,
        floatingPillText: form.promoFloatingPill,
        imageUrl: form.promoImageUrl,
        image: form.promoImageUrl,
      };
    } else {
      updatedContent = {
        ...form.genericFields,
        title: form.title,
        subtitle: form.subtitle,
      };
    }

    try {
      const res = await fetch(`/api/admin/content/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          animationPreset: form.animationPreset,
          isVisible: form.isVisible,
          content: updatedContent,
          status: 'PUBLISHED',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rawdah_content_updated', Date.now().toString());
          window.dispatchEvent(new CustomEvent('rawdah:content-updated'));
        }
        fetch('/api/admin/clear-cache', { method: 'POST' }).catch(() => {});
        setSaveSuccess(`"${form.title}" published and updated live on the storefront!`);
        setTimeout(() => setSaveSuccess(null), 3500);
        setEditingSection(null);
        fetchSections();
      } else {
        alert(data.error || 'Failed to update section');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving section');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSections = sections.filter((s) => {
    if (activeTab === 'banners') {
      return ['hero', 'collection_banner', 'gift_sets_banner'].includes(s.sectionKey);
    }
    if (activeTab === 'editorial') {
      return ['editorial', 'best_sellers', 'reviews'].includes(s.sectionKey);
    }
    if (activeTab === 'promos') {
      return ['announcement', 'welcome_promo', 'faq'].includes(s.sectionKey);
    }
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-stone-700 font-medium">Website CMS</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Website Content & Motion Studio
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Visually manage storefront campaign banners, hero headlines, luxury copy, promotional discount popups,
            and FAQs without touching raw code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSections}
            className="p-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition flex items-center gap-1.5 text-xs font-medium"
            title="Refresh Sections"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#141312] text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'all', label: 'All Sections' },
          { id: 'banners', label: 'Campaign Banners & Hero' },
          { id: 'editorial', label: 'Editorial & Story' },
          { id: 'promos', label: 'Promotions, Badges & FAQs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#D45520] text-white shadow-xs font-semibold'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visual Section Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading website sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-2xl border border-stone-200">
            <p className="text-xs">No sections found under this category.</p>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const c = sec.content || {};
            const previewImg = c.imageUrl || c.bgImage || c.image;

            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Visual Header */}
                  {previewImg ? (
                    <div className="relative h-36 w-full bg-stone-900 overflow-hidden">
                      <Image
                        src={previewImg}
                        alt={sec.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/90 text-stone-800 backdrop-blur-xs">
                          {sec.sectionKey}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-sm font-semibold truncate drop-shadow-sm">
                          {sec.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-200 text-stone-700">
                          {sec.sectionKey}
                        </span>
                        <h3 className="text-sm font-semibold text-stone-900 mt-1">
                          {sec.title}
                        </h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        {sec.type}
                      </span>
                    </div>
                  )}

                  {/* Card Content Summary */}
                  <div className="p-4 space-y-2.5 text-xs">
                    <p className="text-stone-500 text-[11px] line-clamp-2 leading-relaxed">
                      {c.subtitle || c.description || c.text || sec.subtitle || 'Custom editorial section content.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        {sec.animationPreset || 'LUXURY_EASE'}
                      </span>

                      {c.discountPercentage && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {c.discountPercentage}% OFF
                        </span>
                      )}

                      {Array.isArray(c.items) && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 text-stone-600">
                          {c.items.length} FAQs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleVisibility(sec)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                      sec.isVisible
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {sec.isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleEditOpen(sec)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl text-[11px] font-semibold transition shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Section
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          TAILORED VISUAL EDIT MODAL / DRAWER
          No raw JSON needed: clear inputs with live image previews and FAQ manager!
         ========================================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D45520]/10 text-[#D45520] flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                    Edit {editingSection.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Key: <span className="font-mono font-medium text-stone-700">{editingSection.sectionKey}</span> • Type: {editingSection.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSection} className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* General Settings: Title, Motion, Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Section Admin Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-xs focus:ring-1 focus:ring-[#D45520] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Storefront Visibility
                  </label>
                  <select
                    value={form.isVisible ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isVisible: e.target.value === 'true' })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-xs"
                  >
                    <option value="true">Visible (Active on Live Storefront)</option>
                    <option value="false">Hidden (Disabled / Draft)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">
                    Motion Curve & Reveal Preset
                  </label>
                  <select
                    value={form.animationPreset}
                    onChange={(e) => setForm({ ...form, animationPreset: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-xs"
                  >
                    <option value="LUXURY_EASE">LUXURY_EASE (0.22, 1, 0.36, 1) — Smooth royal ease-out</option>
                    <option value="SCALE_SETTLE">SCALE_SETTLE (1.035 to 1.0) — Cinematic campaign zoom settle</option>
                    <option value="EDITORIAL_REVEAL">EDITORIAL_REVEAL (20px lift) — Elegant upward fade</option>
                    <option value="SLIDE_HORIZONTAL">SLIDE_HORIZONTAL — Subtle translucent typography glide</option>
                    <option value="NONE">NONE — Instant static display</option>
                  </select>
                </div>
              </div>

              {/* SECTION-SPECIFIC VISUAL CONTROLS */}

              {/* 1. HERO SECTION FORM */}
              {editingSection.sectionKey === 'hero' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-stone-900 text-sm">
                      Hero Campaign Visual Content
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Changes here directly update the main 4K desert campaign banner on the homepage.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Headline Line 1
                      </label>
                      <input
                        type="text"
                        value={form.headlineLine1}
                        onChange={(e) => setForm({ ...form, headlineLine1: e.target.value })}
                        placeholder="e.g. A Signature Scent,"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Headline Line 2
                      </label>
                      <input
                        type="text"
                        value={form.headlineLine2}
                        onChange={(e) => setForm({ ...form, headlineLine2: e.target.value })}
                        placeholder="e.g. Crafted with Soul"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      Hero Description / Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={form.heroSubtitle}
                      onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                      placeholder="e.g. A bold composition of rare woods, warm amber, and delicate florals..."
                      className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Translucent Watermark Text
                      </label>
                      <input
                        type="text"
                        value={form.watermarkText}
                        onChange={(e) => setForm({ ...form, watermarkText: e.target.value })}
                        placeholder="e.g. SCENT THAT LINGERS"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Floating Turquoise Badge
                      </label>
                      <input
                        type="text"
                        value={form.badgeText}
                        onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                        placeholder="e.g. LONG LASTING"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={form.heroButtonText}
                        onChange={(e) => setForm({ ...form, heroButtonText: e.target.value })}
                        placeholder="e.g. Discover Fragrance"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        CTA Button Link
                      </label>
                      <input
                        type="text"
                        value={form.heroButtonLink}
                        onChange={(e) => setForm({ ...form, heroButtonLink: e.target.value })}
                        placeholder="e.g. /shop"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <ContentImageUploader
                      label="Hero Campaign Background Image"
                      sublabel="Upload 4K desert campaign visuals or luxury flacon banners"
                      imageUrl={form.heroImageUrl}
                      onChange={(url) => setForm({ ...form, heroImageUrl: url })}
                      aspectRatio="hero"
                    />
                  </div>
                </div>
              )}

              {/* 2. TOP ANNOUNCEMENT BAR FORM */}
              {editingSection.sectionKey === 'announcement' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-stone-900 text-sm">
                      Top Announcement Bar
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Appears at the very top of the website on every page.
                    </p>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      Announcement Notice Text
                    </label>
                    <input
                      type="text"
                      value={form.announcementText}
                      onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
                      placeholder="e.g. Complimentary 2ml extrait sample & free express delivery on orders over ৳5,000"
                      className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Highlighted Promo Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.highlightCode}
                        onChange={(e) => setForm({ ...form, highlightCode: e.target.value })}
                        placeholder="e.g. ROYAL15 or SCENT10"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Target Link
                      </label>
                      <input
                        type="text"
                        value={form.announcementLink}
                        onChange={(e) => setForm({ ...form, announcementLink: e.target.value })}
                        placeholder="/shop"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Announcement Preview */}
                  <div className="p-3 bg-[#141312] text-[#ECE7DF] rounded-xl text-center text-xs flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#D45520]" />
                    <span>{form.announcementText || 'Your announcement preview will appear here...'}</span>
                    {form.highlightCode && (
                      <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-amber-300">
                        Use code: {form.highlightCode}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 3. EDITORIAL INTRO FORM */}
              {editingSection.sectionKey === 'editorial' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-stone-900 text-sm">
                      Maison Philosophy & Editorial Statement
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Headline Line 1
                      </label>
                      <input
                        type="text"
                        value={form.headingLine1}
                        onChange={(e) => setForm({ ...form, headingLine1: e.target.value })}
                        placeholder="Luxury,"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Headline Line 2 (Italic Accent)
                      </label>
                      <input
                        type="text"
                        value={form.headingLine2}
                        onChange={(e) => setForm({ ...form, headingLine2: e.target.value })}
                        placeholder="No Compromise."
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Signature Box Heading
                      </label>
                      <input
                        type="text"
                        value={form.signatureTitle}
                        onChange={(e) => setForm({ ...form, signatureTitle: e.target.value })}
                        placeholder="Our Signature Scents (18)"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Signature Box Subtext
                      </label>
                      <input
                        type="text"
                        value={form.signatureSubtitle}
                        onChange={(e) => setForm({ ...form, signatureSubtitle: e.target.value })}
                        placeholder="Explore our collection of refined fragrances..."
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BANNER FORMS (GIFT SETS OR COLLECTION) */}
              {(editingSection.sectionKey === 'gift_sets_banner' ||
                editingSection.sectionKey === 'collection_banner') && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-stone-900 text-sm">
                      {editingSection.sectionKey === 'gift_sets_banner'
                        ? 'Bespoke Coffrets & Gift Sets Banner'
                        : 'The Oud Royale Archive Collection Banner'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Tagline / Category Header
                      </label>
                      <input
                        type="text"
                        value={form.bannerTagline}
                        onChange={(e) => setForm({ ...form, bannerTagline: e.target.value })}
                        placeholder="e.g. THE ART OF GIVING"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Main Title
                      </label>
                      <input
                        type="text"
                        value={form.bannerTitle}
                        onChange={(e) => setForm({ ...form, bannerTitle: e.target.value })}
                        placeholder="e.g. Bespoke Coffrets & Discovery Ensembles"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.bannerDescription}
                      onChange={(e) => setForm({ ...form, bannerDescription: e.target.value })}
                      placeholder="Encased in signature black lacquered wood with gold filigree accents..."
                      className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={form.bannerCtaText}
                        onChange={(e) => setForm({ ...form, bannerCtaText: e.target.value })}
                        placeholder="Explore Gift Sets"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        CTA Button Link
                      </label>
                      <input
                        type="text"
                        value={form.bannerCtaLink}
                        onChange={(e) => setForm({ ...form, bannerCtaLink: e.target.value })}
                        placeholder="/shop?category=Gift+Sets"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <ContentImageUploader
                      label="Banner Backdrop Image"
                      sublabel="Upload wide-aspect luxury campaign banner image"
                      imageUrl={form.bannerImageUrl}
                      onChange={(url) => setForm({ ...form, bannerImageUrl: url })}
                      aspectRatio="wide"
                    />
                  </div>
                </div>
              )}

              {/* 5. FAQ INTERACTIVE MANAGER */}
              {editingSection.sectionKey === 'faq' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        Frequently Asked Questions (FAQ) Manager
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Add, edit, or delete FAQs. Questions show on both the homepage and product pages.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddFaqItem}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        FAQ Section Title
                      </label>
                      <input
                        type="text"
                        value={form.faqTitle}
                        onChange={(e) => setForm({ ...form, faqTitle: e.target.value })}
                        placeholder="Frequently asked questions"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        FAQ Subtitle Description
                      </label>
                      <input
                        type="text"
                        value={form.faqSubtitle}
                        onChange={(e) => setForm({ ...form, faqSubtitle: e.target.value })}
                        placeholder="Key information regarding performance..."
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* List of FAQ Items */}
                  <div className="space-y-3 pt-2">
                    {form.faqItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-400 font-mono">
                            Question #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaqItem(idx)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={item.q}
                            onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                            placeholder="Question..."
                            className="w-full p-2 border border-stone-200 rounded-xl bg-white text-xs font-medium focus:ring-1 focus:ring-[#D45520] focus:outline-none"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            value={item.a}
                            onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                            placeholder="Detailed Answer..."
                            className="w-full p-2 border border-stone-200 rounded-xl bg-white text-xs leading-relaxed focus:ring-1 focus:ring-[#D45520] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. WELCOME PRIVILEGE MODAL & BADGE FORM */}
              {editingSection.sectionKey === 'welcome_promo' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-stone-900 text-sm">
                      Welcome Discount Privilege Pop-up & Persistent Floating Badge
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Configure the celebration popup and discount that persists as visitors scroll.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={form.discountPercentage}
                        onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) })}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-bold text-base text-[#D45520]"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        value={form.couponCode}
                        onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. WELCOME15"
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Pop-up Modal Status
                      </label>
                      <select
                        value={form.promoEnabled ? 'true' : 'false'}
                        onChange={(e) => setForm({ ...form, promoEnabled: e.target.value === 'true' })}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      >
                        <option value="true">Active (Show Pop-up & Pill)</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Modal Title
                      </label>
                      <input
                        type="text"
                        value={form.promoTitle}
                        onChange={(e) => setForm({ ...form, promoTitle: e.target.value })}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-medium mb-1">
                        Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={form.promoTagline}
                        onChange={(e) => setForm({ ...form, promoTagline: e.target.value })}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-medium mb-1">
                      Modal Subtitle / Body Copy
                    </label>
                    <textarea
                      rows={2}
                      value={form.promoSubtitle}
                      onChange={(e) => setForm({ ...form, promoSubtitle: e.target.value })}
                      className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <ContentImageUploader
                      label="Pop-up Header Image"
                      sublabel="Featured flacon or coffer showcase image in the welcome dialogue"
                      imageUrl={form.promoImageUrl}
                      onChange={(url) => setForm({ ...form, promoImageUrl: url })}
                      aspectRatio="square"
                    />
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2.5 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Publish Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
