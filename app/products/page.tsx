import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductsClient } from './ProductsClient';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#fdfcf0]"><Loader2 className="animate-spin text-[#7a2b22]" size={40} /></div>}>
      <ProductsClient />
    </Suspense>
  );
}
