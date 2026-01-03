import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductDetail } from '@/components/ProductDetail';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  // TODO: Fetch product data for metadata
  return {
    title: 'Product Details',
    description: 'View product details, specifications, and reviews',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <Suspense fallback={
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-96 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <ProductDetail slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

