import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Rāwdah Haute Parfumerie',
  description:
    'Our commitment to privacy, data encryption, and discreet client management.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#EAE4DC] shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
            Legal & Discretion
          </span>
          <h1 className="font-serif italic text-3xl sm:text-4xl font-normal text-neutral-900 mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Last Updated: November 2026
          </p>
        </div>

        <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans space-y-6">
          <section>
            <h2 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              1. Our Commitment to Client Confidentiality
            </h2>
            <p>
              At Rāwdah Haute Parfumerie, discretion is paramount. We treat all personal, payment, and delivery information with the strictest security protocols. We never sell, rent, or lease client details to third-party marketing entities.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              2. Information Collected
            </h2>
            <p>
              When you place an order or schedule a consultation, we collect essential details to fulfill your delivery: your name, recipient delivery address, mobile contact number, and email for dispatch notifications.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              3. Payment Security & Encryption
            </h2>
            <p>
              All online digital transactions (Cards, bKash, Nagad) are processed through 256-bit SSL encrypted PCI-DSS compliant financial gateways. Rāwdah does not store raw credit card credentials or mobile banking PINs on its servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              4. Contact Us Regarding Your Data
            </h2>
            <p>
              If you have any questions or wish to update or delete your profile from our private clientele records, please contact our Data Protection Officer at <strong>privacy@rawdahperfumes.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

