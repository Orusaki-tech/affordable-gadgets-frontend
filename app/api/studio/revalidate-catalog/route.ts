import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { brandConfig } from '@/lib/config/brand';

/**
 * Studio product deletes must drop ISR pages. Product and listing routes
 * stay cached for up to an hour, so a successful API delete still looks
 * like the product is on the shop until that timer expires.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Token ')) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const apiBase = brandConfig.apiBaseUrl.replace(/\/+$/, '');
  const profile = await fetch(`${apiBase}/api/inventory/profiles/admin/`, {
    headers: {
      Accept: 'application/json',
      Authorization: auth,
    },
    cache: 'no-store',
  });
  if (!profile.ok) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  let slug: string | undefined;
  try {
    const body = (await request.json()) as { slug?: unknown };
    if (
      typeof body.slug === 'string' &&
      body.slug &&
      !body.slug.includes('/') &&
      !body.slug.includes('..')
    ) {
      slug = body.slug;
    }
  } catch {
    slug = undefined;
  }

  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/categories');
  if (slug) {
    revalidatePath(`/products/${slug}`);
  }

  return NextResponse.json({ revalidated: true });
}
