'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import { CartProvider } from '@/lib/hooks/useCart';
import { AuthSessionBootstrap } from '@/components/AuthSessionBootstrap';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Suspense fallback={null}>
          <AuthSessionBootstrap />
        </Suspense>
        {children}
      </CartProvider>
    </QueryClientProvider>
  );
}







