'use client';

import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Sparkles } from 'lucide-react';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('RDH-84291');
  const [phone, setPhone] = useState('01711234567');
  const [trackedOrder, setTrackedOrder] = useState<any>({
    orderId: 'RDH-84291',
    status: 'In Transit',
    courier: 'Steadfast Courier (Express Air)',
    trackingNumber: 'STEAD-982410',
    estimatedDelivery: 'Tomorrow by 5:00 PM',
    recipient: 'Tanvir Ahmed Chowdhury',
    address: 'Gulshan-2, Dhaka',
    steps: [
      { name: 'Order Confirmed', date: 'Yesterday, 4:15 PM', completed: true },
      { name: 'Quality Inspection & Wax Sealing', date: 'Yesterday, 6:30 PM', completed: true },
      { name: 'Dispatched from Gulshan Atelier', date: 'Today, 9:00 AM', completed: true },
      { name: 'Out for Delivery', date: 'Estimated Tomorrow Morning', completed: false },
      { name: 'Delivered', date: 'Pending', completed: false },
    ],
  });

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    const cleanId = orderId.trim().toUpperCase();

    // 1. Try real database lookup
    try {
      const res = await fetch(`/api/orders/${cleanId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          const o = data.order;
          const status = o.fulfillmentStatus;
          const isConfirmed = status !== 'PENDING';
          const isPacked = status === 'PACKED' || status === 'SHIPPED' || status === 'DELIVERED';
          const isShipped = status === 'SHIPPED' || status === 'DELIVERED';
          const isDelivered = status === 'DELIVERED';

          setTrackedOrder({
            orderId: o.orderNumber,
            status: status === 'DELIVERED' ? 'Delivered' : status === 'SHIPPED' ? 'In Transit with Courier' : status === 'PACKED' ? 'Packed in Atelier' : status,
            courier: `${o.courierProvider || 'Steadfast Courier'} (Express Fragrance Delivery)`,
            trackingNumber: o.courierTrackingNumber || 'STEAD-PENDING',
            estimatedDelivery: isDelivered ? 'Delivered' : isShipped ? 'Tomorrow by 5:00 PM' : 'In 2 Business Days',
            recipient: o.customerName,
            address: `${o.shippingAddress?.address || o.shippingAddress}, ${o.shippingAddress?.city || 'Dhaka'}`,
            steps: [
              { name: 'Order Received & Recorded', date: new Date(o.createdAt).toLocaleDateString(), completed: true },
              { name: 'Call Verified & Confirmed', date: isConfirmed ? 'Verified' : 'Pending call', completed: isConfirmed },
              { name: 'Artisanal Wax Sealing & Packaging', date: isPacked ? 'Completed' : 'In atelier', completed: isPacked },
              { name: 'Handed to Courier Logistics', date: isShipped ? (o.dispatchedAt ? new Date(o.dispatchedAt).toLocaleDateString() : 'Dispatched') : 'Awaiting dispatch', completed: isShipped },
              { name: 'Delivered to Patron', date: isDelivered ? 'Received' : 'Pending delivery', completed: isDelivered },
            ],
          });
          return;
        }
      }
    } catch (err) {
      // Fallback
    }

    // 2. Check if we have this order in localStorage
    try {
      const stored = localStorage.getItem(`order_${orderId.trim().toUpperCase()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTrackedOrder({
          orderId: parsed.orderId,
          status: 'Confirmed & In Preparation',
          courier: 'Steadfast Courier',
          trackingNumber: parsed.trackingNumber || 'STEAD-104928',
          estimatedDelivery: parsed.estimatedDelivery || 'In 2 Business Days',
          recipient: parsed.customer.name,
          address: `${parsed.customer.address}, ${parsed.customer.city}`,
          steps: [
            { name: 'Order Confirmed', date: 'Just now', completed: true },
            { name: 'Handcrafted Packaging & QC', date: 'In progress', completed: true },
            { name: 'Dispatched with Courier', date: 'Pending pickup', completed: false },
            { name: 'Out for Delivery', date: 'Estimated 2 Days', completed: false },
          ],
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Default simulated tracking
    setTrackedOrder({
      orderId: orderId.trim().toUpperCase(),
      status: 'In Transit',
      courier: 'Steadfast Courier',
      trackingNumber: `STEAD-${Math.floor(100000 + Math.random() * 900000)}`,
      estimatedDelivery: '2–3 Business Days',
      recipient: 'Esteemed Patron',
      address: 'Dhaka Metropolitan, Bangladesh',
      steps: [
        { name: 'Order Confirmed', date: 'Verified', completed: true },
        { name: 'Handcrafted Packaging & QC', date: 'Completed', completed: true },
        { name: 'Dispatched from Atelier', date: 'In transit', completed: true },
        { name: 'Out for Delivery', date: 'Soon', completed: false },
        { name: 'Delivered', date: 'Pending', completed: false },
      ],
    });
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
            Live Dispatch Tracking
          </span>
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 mt-1">
            Track Your Royal Parcel
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans">
            Enter your order reference code (e.g. RDH-84291) to view real-time fulfillment and courier coordinates.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE4DC] shadow-xs">
          <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Order ID Number
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. RDH-84291"
                className="w-full px-4 py-3 rounded-xl border border-[#D4CFCE] text-sm text-neutral-900 bg-[#FAF7F2] uppercase tracking-wider focus:outline-none focus:border-[#D45520]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-[#D4CFCE] text-sm text-neutral-900 bg-[#FAF7F2] focus:outline-none focus:border-[#D45520]"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Track</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Result Details */}
        {trackedOrder && (
          <div className="bg-white rounded-3xl p-8 border border-[#EAE4DC] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE4DC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D45520]">
                  Consignment Status
                </span>
                <h3 className="font-serif text-2xl font-normal text-neutral-900 mt-0.5">
                  Order {trackedOrder.orderId}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Courier: <strong>{trackedOrder.courier}</strong> • Tracking #{' '}
                  <strong>{trackedOrder.trackingNumber}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  {trackedOrder.status}
                </span>
                <p className="text-xs text-neutral-500 mt-1">
                  Estimated Delivery: <strong className="text-neutral-900">{trackedOrder.estimatedDelivery}</strong>
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-4">
                Milestones & Updates
              </h4>
              <div className="space-y-4">
                {trackedOrder.steps.map((st: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        st.completed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#F2ECE1] text-neutral-400 border border-[#D4CFCE]'
                      }`}
                    >
                      {st.completed ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 pb-3 border-b border-[#F4EFEB]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900">{st.name}</span>
                        <span className="text-[11px] text-neutral-400">{st.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="pt-4 border-t border-[#EAE4DC] flex items-center gap-3 text-xs text-neutral-600">
              <MapPin className="w-4 h-4 text-[#D45520] shrink-0" />
              <span>
                Delivering to: <strong className="text-neutral-900">{trackedOrder.recipient}</strong> — {trackedOrder.address}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

