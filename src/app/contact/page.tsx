'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Fragrance Recommendation Consultation',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: 'Fragrance Recommendation Consultation',
        message: '',
      });
      setSubmitted(false);
    }, 4000);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
            Private Concierge
          </span>
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1">
            Connect with the Atelier
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans">
            Whether inquiring about bespoke bridal coffrets, corporate gifting, or booking a private olfactory consultation at our Gulshan showroom.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Flagship Showroom Details (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-[#EAE4DC] shadow-xs space-y-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D45520] block mb-1">
                Dhaka Flagship
              </span>
              <h2 className="font-serif text-2xl font-normal text-neutral-900">
                Gulshan Atelier & Tasting Salon
              </h2>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Step into our sensory sanctuary to sample raw amber resins, vintage agarwood distillations, and custom scent flights.
              </p>
            </div>

            <div className="space-y-5 text-xs text-neutral-700">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Address</h4>
                  <p className="text-neutral-500 mt-0.5">
                    Plot 18, Road 11, Block D, Gulshan-2, Dhaka 1212, Bangladesh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Telephone</h4>
                  <p className="text-neutral-500 mt-0.5">
                    +880 1711-000000 / +880 1819-000000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Concierge Email</h4>
                  <p className="text-neutral-500 mt-0.5">concierge@rawdahperfumes.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Opening Hours</h4>
                  <p className="text-neutral-500 mt-0.5">
                    Saturday – Friday: 11:00 AM – 10:00 PM (BST)
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Concierge Button */}
            <div className="pt-4 border-t border-[#EAE4DC]">
              <a
                href="https://wa.me/8801711000000?text=Hello%20Rawdah%2C%20I%20would%20like%20to%20inquire%20about%20your%20perfumes."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Instantly via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-[#EAE4DC] shadow-xs">
            <h2 className="font-serif text-2xl font-normal text-neutral-900 mb-1">
              Send a Private Message
            </h2>
            <p className="text-xs text-neutral-500 mb-6 font-sans">
              Our fragrance advisors typically reply within two hours during business timings.
            </p>

            {submitted ? (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-2xl border border-[#EAE4DC]">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-1">
                  Message Dispatched
                </h3>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                  Thank you for reaching out. A Rāwdah fragrance concierge has received your request and will contact you promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Barrister Nabil Hossain"
                      className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Subject of Inquiry
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                  >
                    <option value="Fragrance Recommendation Consultation">
                      Personalized Fragrance Consultation
                    </option>
                    <option value="Wedding / Bespoke Gifting Service">
                      Wedding & Corporate Bespoke Gifting
                    </option>
                    <option value="Order Tracking & Delivery Status">
                      Order Tracking & Delivery Status
                    </option>
                    <option value="Showroom Private Appointment">
                      Book Private Showroom Appointment
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Message Details *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about the scent profile or assistance you are seeking..."
                    className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message to Atelier</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

