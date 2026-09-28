import { redirect } from 'next/navigation';

/** Edit opens the storefront mirror with the in-place edit drawer. */
export default async function StudioProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/studio/products?edit=${encodeURIComponent(id)}`);
}
