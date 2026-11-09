'use client';

import React, { useState, useEffect, use } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/products/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#D45520] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-center text-neutral-500">Fragrance not found.</div>;
  }

  return <ProductForm initialData={product} isEdit={true} />;
}

