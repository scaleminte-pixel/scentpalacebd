'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  EyeOff,
  Eye,
  ShieldCheck,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (review: any) => {
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !review.isApproved }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, isApproved: !r.isApproved } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update review:', err);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'APPROVED') return r.isApproved;
    if (filter === 'PENDING') return !r.isApproved;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Patron Testimonials & Reviews</h1>
          <p className="text-xs text-stone-500 mt-1">
            Moderate olfactory testimonials, verify genuine buyers, and curate homepage reviews.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'APPROVED', 'PENDING'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
              filter === t
                ? 'bg-stone-900 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {t === 'ALL' ? 'All Reviews' : t === 'APPROVED' ? 'Approved & Visible' : 'Pending Moderation'}
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-stone-400">
            <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
            Loading testimonials...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-stone-400 bg-white rounded-2xl border border-stone-200 text-xs">
            No testimonials match the selected status.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-stone-900 ml-1.5">{r.rating}.0</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-sm">{r.title}</h3>
                <p className="text-xs text-stone-600 leading-relaxed italic">&ldquo;{r.comment}&rdquo;</p>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-stone-100">
                  <div>
                    <span className="font-semibold text-stone-800">{r.author}</span>
                    <span className="text-stone-400 ml-1.5">({r.city})</span>
                  </div>
                  <span className="text-[11px] text-[#D45520] font-medium">{r.productName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  {r.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Verified Buyer
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleApprove(r)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    r.isApproved
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-[#D45520] text-white hover:bg-[#B34316]'
                  }`}
                >
                  {r.isApproved ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-stone-500" /> Suppress
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Approve & Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

