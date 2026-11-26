'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentImageUploader from '@/components/admin/ContentImageUploader';
import { DEFAULT_OUR_STORY, type OurStoryContent } from '@/lib/our-story-defaults';
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

    // Deal of the Day
    dealProductSlug: '',
    dealVariantId: '',
    dealPrice: '' as string | number,
    dealEndsAt: '',
    dealTagline: '',

    // Editorial showcase tiles (3 product slugs)
    showcaseSlugs: ['', '', ''] as string[],

    // Shop by Scent
    scentHeading: 'Shop by Scent',
    scentItems: [] as { name: string; image: string; link: string }[],

    // Instagram gallery
    igHeading: 'Follow Our Journey',
    igHandle: '@scentpalace.bd',
    igProfileUrl: 'https://instagram.com',
    igItems: [] as { image: string; link: string }[],

    // Our Story page (paragraphs edited as text separated by blank lines)
    story: { ...DEFAULT_OUR_STORY } as OurStoryContent,
    storyText: DEFAULT_OUR_STORY.storyParagraphs.join('\n\n'),

    // Shop page heading
    shopEyebrow: '',
    shopTitle: '',
    shopDescription: '',

    // Generic fallback for any other sections
    genericFields: {} as Record<string, any>,
  });

  // All published products for the Deal of the Day picker
  const [dealProducts, setDealProducts] = useState<any[]>([]);
  useEffect(() => {
    if (!['daily_deal', 'editorial'].includes(editingSection?.sectionKey) || dealProducts.length > 0) return;
    fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products || []).slice().sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
        setDealProducts(list);
      })
      .catch(() => {});
  }, [editingSection, dealProducts.length]);

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

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

      dealProductSlug: c.productSlug || '',
      dealVariantId: c.variantId || '',
      dealPrice: c.dealPrice ?? '',
      dealEndsAt: toLocalInput(c.endsAt),
      dealTagline: c.tagline || '',
      showcaseSlugs: [0, 1, 2].map((i) => (Array.isArray(c.showcaseSlugs) ? c.showcaseSlugs[i] || '' : '')),
      scentHeading: c.heading || 'Shop by Scent',
      scentItems: Array.isArray(c.items) && section.sectionKey === 'shop_by_scent'
        ? c.items.map((it: any) => ({ name: it.name || '', image: it.image || '', link: it.link || '' }))
        : [],
      igHeading: c.heading || 'Follow Our Journey',
      igHandle: c.handle ?? '@scentpalace.bd',
      igProfileUrl: c.profileUrl || 'https://instagram.com',
      igItems: Array.isArray(c.items) && section.sectionKey === 'instagram'
        ? c.items.map((it: any) => ({ image: it.image || '', link: it.link || '' }))
        : [],
      story:
        section.sectionKey === 'our_story'
          ? {
              ...DEFAULT_OUR_STORY,
              ...c,
              pillars: Array.isArray(c.pillars) ? c.pillars : DEFAULT_OUR_STORY.pillars,
              storyParagraphs: Array.isArray(c.storyParagraphs) ? c.storyParagraphs : DEFAULT_OUR_STORY.storyParagraphs,
            }
          : { ...DEFAULT_OUR_STORY },
      storyText: (section.sectionKey === 'our_story' && Array.isArray(c.storyParagraphs)
        ? c.storyParagraphs
        : DEFAULT_OUR_STORY.storyParagraphs
      ).join('\n\n'),
      shopEyebrow: c.eyebrow || '',
      shopTitle: c.title || '',
      shopDescription: c.description || '',

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
        showcaseSlugs: form.showcaseSlugs.filter(Boolean),
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
    } else if (key === 'shop_by_scent') {
      updatedContent = {
        heading: form.scentHeading,
        items: form.scentItems
          .filter((it) => it.image && it.name)
          .map((it) => ({ ...it, link: it.link || `/shop?scent=${encodeURIComponent(it.name)}` })),
      };
    } else if (key === 'instagram') {
      updatedContent = {
        heading: form.igHeading,
        handle: form.igHandle,
        profileUrl: form.igProfileUrl,
        items: form.igItems.filter((it) => it.image),
      };
    } else if (key === 'our_story') {
      updatedContent = {
        ...form.story,
        storyParagraphs: form.storyText
          .split(/\n\s*\n/)
          .map((t) => t.trim())
          .filter(Boolean),
        pillars: form.story.pillars.filter((p) => p.title || p.text),
      };
    } else if (key === 'shop_header') {
      updatedContent = { eyebrow: form.shopEyebrow, title: form.shopTitle, description: form.shopDescription };
    } else if (key === 'daily_deal') {
      const product = dealProducts.find((p: any) => p.slug === form.dealProductSlug);
      const variant = product?.variants?.find((v: any) => v.id === form.dealVariantId) || product?.variants?.[0];
      const price = Number(form.dealPrice);
      if (form.isVisible) {
        if (!product || !variant) {
          alert('Please choose a product for the deal.');
          setIsSaving(false);
          return;
        }
        if (!price || price <= 0 || price >= variant.price) {
          alert(`Deal price must be lower than the regular price (৳${variant.price}).`);
          setIsSaving(false);
          return;
        }
        if (!form.dealEndsAt || new Date(form.dealEndsAt).getTime() <= Date.now()) {
          alert('Please set an end date/time in the future.');
          setIsSaving(false);
          return;
        }
      }
      updatedContent = {
        productSlug: form.dealProductSlug,
        variantId: variant?.id || '',
        dealPrice: price || 0,
        endsAt: form.dealEndsAt ? new Date(form.dealEndsAt).toISOString() : '',
        tagline: form.dealTagline,
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
      return ['editorial', 'best_sellers', 'reviews', 'shop_by_scent', 'instagram', 'shop_header', 'our_story'].includes(s.sectionKey);
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#033528] text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm"
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
                ? 'bg-[#033528] text-white shadow-xs font-semibold'
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
            <div className="w-8 h-8 border-2 border-stone-200 border-t-[#033528] rounded-full animate-spin mx-auto mb-3" />
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#033528] hover:bg-[#022A20] text-white rounded-xl text-[11px] font-semibold transition shadow-xs cursor-pointer"
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
                <div className="w-10 h-10 rounded-2xl bg-[#033528]/10 text-[#033528] flex items-center justify-center shrink-0">
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
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white text-xs focus:ring-1 focus:ring-[#033528] focus:outline-none"
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
                  <div className="p-3 bg-[#033528] text-[#EDE5D3] rounded-xl text-center text-xs flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#033528]" />
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
              {editingSection.sectionKey === 'editorial' && (
                <div className="space-y-3 border-t border-stone-100 pt-4 text-xs">
                  <h4 className="font-semibold text-stone-900">Showcase products under the headline</h4>
                  <p className="text-stone-500">
                    Choose the 3 products shown as small tiles under &ldquo;{form.headingLine1} {form.headingLine2}&rdquo;.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i}>
                        <label className="block text-stone-700 font-semibold mb-1">Product {i + 1}</label>
                        <select
                          value={form.showcaseSlugs[i] || ''}
                          onChange={(e) => {
                            const next = [...form.showcaseSlugs];
                            next[i] = e.target.value;
                            setForm({ ...form, showcaseSlugs: next });
                          }}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                        >
                          <option value="">— Choose ({dealProducts.length} products) —</option>
                          {dealProducts.map((p: any) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const sel = dealProducts.find((p: any) => p.slug === form.showcaseSlugs[i]);
                          return sel?.images?.[0] ? (
                            <img src={sel.images[0]} alt="" className="mt-2 w-16 h-16 object-contain rounded-lg border border-stone-200 bg-white" />
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#033528] hover:bg-[#022A20] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
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
                            className="w-full p-2 border border-stone-200 rounded-xl bg-white text-xs font-medium focus:ring-1 focus:ring-[#033528] focus:outline-none"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            value={item.a}
                            onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                            placeholder="Detailed Answer..."
                            className="w-full p-2 border border-stone-200 rounded-xl bg-white text-xs leading-relaxed focus:ring-1 focus:ring-[#033528] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. WELCOME PRIVILEGE MODAL & BADGE FORM */}
              {editingSection.sectionKey === 'shop_by_scent' && (
                <div className="space-y-4 border-t border-stone-100 pt-4 text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Section heading</label>
                    <input value={form.scentHeading} onChange={(e) => setForm({ ...form, scentHeading: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                  </div>
                  {form.scentItems.map((it, i) => (
                    <div key={i} className="rounded-xl border border-stone-200 p-3 space-y-2 bg-stone-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">Card {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, scentItems: form.scentItems.filter((_, j) => j !== i) })}
                          className="text-rose-600 hover:underline"
                        >
                          Remove card
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-stone-600 mb-1">Card text</label>
                          <input
                            value={it.name}
                            onChange={(e) => {
                              const next = [...form.scentItems];
                              next[i] = { ...it, name: e.target.value };
                              setForm({ ...form, scentItems: next });
                            }}
                            className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 mb-1">Link (optional)</label>
                          <input
                            value={it.link}
                            placeholder="/shop?scent=…"
                            onChange={(e) => {
                              const next = [...form.scentItems];
                              next[i] = { ...it, link: e.target.value };
                              setForm({ ...form, scentItems: next });
                            }}
                            className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                          />
                        </div>
                      </div>
                      <ContentImageUploader
                        label="Card image"
                        sublabel="Square image works best"
                        imageUrl={it.image}
                        onChange={(url) => {
                          const next = [...form.scentItems];
                          next[i] = { ...it, image: url };
                          setForm({ ...form, scentItems: next });
                        }}
                        aspectRatio="square"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scentItems: [...form.scentItems, { name: '', image: '', link: '' }] })}
                    className="px-3 py-2 rounded-lg border border-dashed border-stone-300 hover:bg-stone-50 font-semibold"
                  >
                    + Add card
                  </button>
                </div>
              )}

              {editingSection.sectionKey === 'instagram' && (
                <div className="space-y-4 border-t border-stone-100 pt-4 text-xs">
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 leading-relaxed">
                    <strong>How this works:</strong> these photos are not pulled from Instagram automatically. Upload the
                    photos you want to show (for example, screenshots or the original images of your Instagram posts) and
                    paste each post&apos;s link. Clicking a photo opens that post; the &ldquo;Instagram&rdquo; button opens
                    your profile. Automatic syncing would need an Instagram/Meta API token.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Section heading</label>
                      <input value={form.igHeading} onChange={(e) => setForm({ ...form, igHeading: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Instagram handle</label>
                      <input value={form.igHandle} onChange={(e) => setForm({ ...form, igHandle: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">Profile link</label>
                      <input
                        value={form.igProfileUrl}
                        placeholder="https://instagram.com/yourpage"
                        onChange={(e) => setForm({ ...form, igProfileUrl: e.target.value })}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                  {form.igItems.map((it, i) => (
                    <div key={i} className="rounded-xl border border-stone-200 p-3 space-y-2 bg-stone-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">Photo {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, igItems: form.igItems.filter((_, j) => j !== i) })}
                          className="text-rose-600 hover:underline"
                        >
                          Remove photo
                        </button>
                      </div>
                      <div>
                        <label className="block text-stone-600 mb-1">Instagram post link (optional)</label>
                        <input
                          value={it.link}
                          placeholder="https://www.instagram.com/p/…"
                          onChange={(e) => {
                            const next = [...form.igItems];
                            next[i] = { ...it, link: e.target.value };
                            setForm({ ...form, igItems: next });
                          }}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                        />
                      </div>
                      <ContentImageUploader
                        label="Photo"
                        sublabel="Square image works best"
                        imageUrl={it.image}
                        onChange={(url) => {
                          const next = [...form.igItems];
                          next[i] = { ...it, image: url };
                          setForm({ ...form, igItems: next });
                        }}
                        aspectRatio="square"
                      />
                    </div>
                  ))}
                  {form.igItems.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, igItems: [...form.igItems, { image: '', link: '' }] })}
                      className="px-3 py-2 rounded-lg border border-dashed border-stone-300 hover:bg-stone-50 font-semibold"
                    >
                      + Add photo
                    </button>
                  )}
                </div>
              )}

              {editingSection.sectionKey === 'our_story' && (() => {
                const st = form.story;
                const set = (patch: Partial<OurStoryContent>) => setForm({ ...form, story: { ...st, ...patch } });
                const field = (label: string, key: keyof OurStoryContent, multiline = false) => (
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">{label}</label>
                    {multiline ? (
                      <textarea rows={3} value={String(st[key] ?? '')} onChange={(e) => set({ [key]: e.target.value } as any)} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                    ) : (
                      <input value={String(st[key] ?? '')} onChange={(e) => set({ [key]: e.target.value } as any)} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                    )}
                  </div>
                );
                return (
                  <div className="space-y-6 border-t border-stone-100 pt-4 text-xs">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-stone-900">1. Top banner</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {field('Small top line', 'heroEyebrow')}
                        {field('Main heading', 'heroTitle')}
                      </div>
                      {field('Text under heading', 'heroSubtitle', true)}
                      <ContentImageUploader
                        label="Banner background image"
                        sublabel="Wide image, shown darkened behind the text"
                        imageUrl={st.heroImage}
                        onChange={(url) => set({ heroImage: url })}
                        aspectRatio="hero"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-stone-900">2. Story</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {field('Small top line', 'storyEyebrow')}
                        {field('Heading', 'storyHeading')}
                      </div>
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">
                          Story text <span className="font-normal text-stone-500">(leave an empty line between paragraphs)</span>
                        </label>
                        <textarea rows={8} value={form.storyText} onChange={(e) => setForm({ ...form, storyText: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                      </div>
                      <ContentImageUploader
                        label="Story image (right side)"
                        sublabel="Portrait image works best. Remove it to show text only."
                        imageUrl={st.storyImage}
                        onChange={(url) => set({ storyImage: url })}
                        aspectRatio="square"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-stone-900">3. Feature boxes</h4>
                      {st.pillars.map((pl, i) => (
                        <div key={i} className="rounded-xl border border-stone-200 p-3 space-y-2 bg-stone-50/50">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-800">Box {i + 1}</span>
                            <button
                              type="button"
                              onClick={() => set({ pillars: st.pillars.filter((_, j) => j !== i) })}
                              className="text-rose-600 hover:underline"
                            >
                              Remove box
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-stone-600 mb-1">Icon (text/emoji)</label>
                              <input
                                value={pl.icon}
                                maxLength={4}
                                onChange={(e) => {
                                  const next = [...st.pillars];
                                  next[i] = { ...pl, icon: e.target.value };
                                  set({ pillars: next });
                                }}
                                className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-stone-600 mb-1">Title</label>
                              <input
                                value={pl.title}
                                onChange={(e) => {
                                  const next = [...st.pillars];
                                  next[i] = { ...pl, title: e.target.value };
                                  set({ pillars: next });
                                }}
                                className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-stone-600 mb-1">Text</label>
                            <textarea
                              rows={3}
                              value={pl.text}
                              onChange={(e) => {
                                const next = [...st.pillars];
                                next[i] = { ...pl, text: e.target.value };
                                set({ pillars: next });
                              }}
                              className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                            />
                          </div>
                        </div>
                      ))}
                      {st.pillars.length < 6 && (
                        <button
                          type="button"
                          onClick={() => set({ pillars: [...st.pillars, { icon: '✦', title: '', text: '' }] })}
                          className="px-3 py-2 rounded-lg border border-dashed border-stone-300 hover:bg-stone-50 font-semibold"
                        >
                          + Add box
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-stone-900">4. Bottom call to action</h4>
                      {field('Heading', 'ctaTitle')}
                      {field('Text', 'ctaText', true)}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {field('Button text', 'ctaButtonText')}
                        {field('Button link', 'ctaButtonLink')}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {editingSection.sectionKey === 'shop_header' && (
                <div className="space-y-3 border-t border-stone-100 pt-4 text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Small top line</label>
                    <input value={form.shopEyebrow} onChange={(e) => setForm({ ...form, shopEyebrow: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Main heading</label>
                    <input value={form.shopTitle} onChange={(e) => setForm({ ...form, shopTitle: e.target.value })} className="w-full p-2.5 border border-stone-200 rounded-xl bg-white" />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={form.shopDescription}
                      onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                      className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}

              {editingSection.sectionKey === 'daily_deal' && (() => {
                const selected = dealProducts.find((p: any) => p.slug === form.dealProductSlug);
                const variants = selected?.variants || [];
                const variant = variants.find((v: any) => v.id === form.dealVariantId) || variants[0];
                const price = Number(form.dealPrice);
                const pct = variant && price > 0 && price < variant.price ? Math.round(((variant.price - price) / variant.price) * 100) : 0;
                return (
                  <div className="space-y-4 border-t border-stone-100 pt-4 text-xs">
                    <h4 className="font-semibold text-stone-900">Deal of the Day</h4>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">
                        Product ({dealProducts.length} available)
                      </label>
                      <select
                        value={form.dealProductSlug}
                        onChange={(e) => {
                          const p = dealProducts.find((x: any) => x.slug === e.target.value);
                          setForm({ ...form, dealProductSlug: e.target.value, dealVariantId: p?.variants?.[0]?.id || '' });
                        }}
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                      >
                        <option value="">— Choose a product —</option>
                        {dealProducts.map((p: any) => (
                          <option key={p.slug} value={p.slug}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Size</label>
                        <select
                          value={variant?.id || ''}
                          onChange={(e) => setForm({ ...form, dealVariantId: e.target.value })}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                          disabled={!selected}
                        >
                          {variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.size} — regular ৳{v.price} ({v.stock} in stock)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Deal price (৳)</label>
                        <input
                          type="number"
                          min={1}
                          value={form.dealPrice}
                          onChange={(e) => setForm({ ...form, dealPrice: e.target.value })}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                        />
                        {pct > 0 && <span className="text-emerald-700 mt-1 block">{pct}% off the regular price</span>}
                      </div>
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Deal ends at</label>
                        <input
                          type="datetime-local"
                          value={form.dealEndsAt}
                          onChange={(e) => setForm({ ...form, dealEndsAt: e.target.value })}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-semibold mb-1">Tagline (optional)</label>
                        <input
                          type="text"
                          value={form.dealTagline}
                          onChange={(e) => setForm({ ...form, dealTagline: e.target.value })}
                          className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-stone-500">
                      The deal shows on the homepage until the end time, and customers are charged the deal price at
                      checkout. Set visibility to Hidden to stop the deal.
                    </p>
                  </div>
                );
              })()}

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
                        className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-bold text-base text-[#033528]"
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
                  className="px-5 py-2.5 bg-[#033528] hover:bg-[#022A20] text-white rounded-xl font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
