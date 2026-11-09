'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, CheckCircle, AlertCircle } from 'lucide-react';

function BkashSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentID = searchParams.get('paymentID') || 'BK_SIM_DEMO';
  const amount = searchParams.get('amount') || '12500';
  const orderNumber = searchParams.get('order') || 'RDH-10499';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [walletPhone, setWalletPhone] = useState('01711223344');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('12345');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      // Redirect to the server callback
      router.push(`/api/payments/bkash/callback?paymentID=${paymentID}&orderId=${orderNumber}&status=success`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
        {/* bKash Header */}
        <div className="bg-[#E2136E] text-white p-6 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold tracking-tight">bKash Payment</div>
            <div className="text-xs text-pink-100 mt-0.5">Sandbox Merchant Simulator</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
            ৳
          </div>
        </div>

        {/* Merchant Details Bar */}
        <div className="bg-[#F9F9F9] border-b border-neutral-200 p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-500">Merchant:</span>{' '}
            <strong className="text-neutral-900 font-semibold">Rāwdah Haute Parfumerie</strong>
          </div>
          <div>
            <span className="text-neutral-500">Invoice:</span>{' '}
            <strong className="text-neutral-900 font-semibold">{orderNumber}</strong>
          </div>
        </div>

        <div className="p-6">
          {/* Amount Due Display */}
          <div className="text-center pb-6 border-b border-neutral-100">
            <span className="text-xs text-neutral-500 uppercase tracking-wider block">Total Amount Due</span>
            <span className="text-3xl font-bold text-neutral-900 mt-1 block">
              ৳{Number(amount).toLocaleString('en-US')}
            </span>
          </div>

          {step === 1 && (
            <form onSubmit={handleConfirmOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
                  Your bKash Account Number
                </label>
                <input
                  type="tel"
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-sm font-semibold tracking-wider text-neutral-900 focus:outline-none focus:border-[#E2136E]"
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase">
                    Verification Code (OTP)
                  </label>
                  <span className="text-[10px] text-pink-700 font-semibold">Sandbox OTP: 123456</span>
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-sm font-mono tracking-widest text-neutral-900 focus:outline-none focus:border-[#E2136E]"
                  placeholder="123456"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#E2136E] hover:bg-[#C90E60] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to PIN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirmPin} className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-neutral-500" />
                    Enter 5-Digit bKash PIN
                  </label>
                  <span className="text-[10px] text-pink-700 font-semibold">Sandbox PIN: 12345</span>
                </div>
                <input
                  type="password"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 text-lg font-mono tracking-[0.5em] text-center text-neutral-900 focus:outline-none focus:border-[#E2136E]"
                  required
                />
              </div>

              <div className="bg-pink-50 rounded-xl p-3 border border-pink-100 flex items-start gap-2 text-[11px] text-pink-900">
                <ShieldCheck className="w-4 h-4 text-[#E2136E] shrink-0 mt-0.5" />
                <span>
                  Testing Sandbox Simulation: Submitting will trigger server-side verification and confirm order <strong>{orderNumber}</strong>.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/checkout?cancelled=true`)}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#E2136E] hover:bg-[#C90E60] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-neutral-50 p-4 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
          Secured with 256-bit TLS encryption • bKash Payment Gateway
        </div>
      </div>
    </div>
  );
}

export default function BkashSimulationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Loading bKash...</div>}>
      <BkashSimulationContent />
    </Suspense>
  );
}

