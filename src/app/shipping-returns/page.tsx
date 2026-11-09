import React from 'react';
import { Metadata } from 'next';
import { Truck, ShieldCheck, RotateCcw, Package, Clock, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Returns Policy | Rāwdah Haute Parfumerie',
  description:
    'Details on complimentary express delivery across Bangladesh, same-day delivery in Dhaka, and our Sample First returns guarantee.',
};

export default function ShippingReturnsPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
            Atelier Logistics
          </span>
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1">
            Shipping & Returns Policy
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans">
            Designed for effortless elegance, discreet handling, and total peace of mind.
          </p>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EAE4DC] shadow-xs">
            <Truck className="w-8 h-8 text-[#D45520] mb-3 stroke-[1.8]" />
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-1">
              Complimentary Delivery
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              Every purchase exceeding ৳5,000 receives free tracked delivery anywhere in Bangladesh.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAE4DC] shadow-xs">
            <Clock className="w-8 h-8 text-[#D45520] mb-3 stroke-[1.8]" />
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-1">
              Dhaka Same-Day Express
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              Orders placed before 4:00 PM in Dhaka city can be dispatched via priority express courier.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#EAE4DC] shadow-xs">
            <ShieldCheck className="w-8 h-8 text-[#D45520] mb-3 stroke-[1.8]" />
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-1">
              Sample First Guarantee
            </h3>
            <p className="text-xs text-neutral-500 font-sans leading-relaxed">
              Test the included 2ml sample vial first. If it does not enchant you, return the sealed bottle.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#EAE4DC] space-y-8 shadow-xs">
          <div>
            <h2 className="font-serif text-2xl font-normal text-neutral-900 pb-3 border-b border-[#EAE4DC] mb-4">
              1. Delivery Options & Rates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE4DC] text-neutral-500 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Service Level</th>
                    <th className="pb-3 font-semibold">Destination</th>
                    <th className="pb-3 font-semibold">Timeline</th>
                    <th className="pb-3 font-semibold">Fee (Under ৳5,000)</th>
                    <th className="pb-3 font-semibold">Fee (Over ৳5,000)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEB] text-neutral-700">
                  <tr>
                    <td className="py-3 font-medium text-neutral-900">Standard Concierge</td>
                    <td className="py-3">Dhaka Metropolitan</td>
                    <td className="py-3">24–48 Hours</td>
                    <td className="py-3">৳60</td>
                    <td className="py-3 font-semibold text-emerald-700">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-neutral-900">Priority Express</td>
                    <td className="py-3">Dhaka Metropolitan</td>
                    <td className="py-3">Same Day (4 Hours)</td>
                    <td className="py-3">৳150</td>
                    <td className="py-3 font-semibold text-emerald-700">৳50</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-neutral-900">Nationwide Express</td>
                    <td className="py-3">All 64 Districts</td>
                    <td className="py-3">2–4 Business Days</td>
                    <td className="py-3">৳120</td>
                    <td className="py-3 font-semibold text-emerald-700">Free</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-normal text-neutral-900 pb-3 border-b border-[#EAE4DC] mb-4">
              2. The Sample First Exchange & Return Guarantee
            </h2>
            <div className="text-xs text-neutral-600 space-y-3 leading-relaxed font-sans">
              <p>
                We understand that purchasing an haute parfumerie masterpiece online requires total trust. To ensure you find your perfect olfactive match, every 50ml, 100ml, and 200ml flacon arrives packaged alongside a complimentary 2ml spray vial of the identical formulation.
              </p>
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EAE4DC] space-y-2">
                <h4 className="font-semibold text-neutral-900 text-sm">How to return or exchange:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-700">
                  <li>Upon delivery, open the discovery sample vial and test on clean skin for 24-48 hours.</li>
                  <li>Do NOT break the security wax ribbon or cellophane seal on the full-size presentation box.</li>
                  <li>If you wish to exchange for another fragrance or request a refund, notify our concierge via WhatsApp or email within 7 days.</li>
                  <li>We dispatch our courier to collect the sealed bottle directly from your doorstep.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

