import { redirect } from 'next/navigation';

/** Create opens the storefront mirror with the in-place create drawer. */
export default function StudioNewProductPage() {
  redirect('/studio/products?new=1');
}
