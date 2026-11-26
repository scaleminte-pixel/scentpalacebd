import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { OrderConfirmationContent } from './OrderConfirmationContent';

export const metadata: Metadata = {
  title: 'Order Confirmation | Scent Palace BD',
  description: 'Thank you for your order with Scent Palace BD.',
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F2E6] flex items-center justify-center p-8">
          <div className="w-10 h-10 border-2 border-[#033528] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

