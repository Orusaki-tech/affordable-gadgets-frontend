import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Preserve UTM params through the OAuth redirect cycle
  const utmParams = new URLSearchParams();
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const val = searchParams.get(key);
    if (val) utmParams.set(key, val);
  }
  const utmString = utmParams.toString();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const target = (() => {
        const base = isLocalEnv ? `${origin}${next}` : forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`;
        return utmString ? `${base}${base.includes('?') ? '&' : '?'}${utmString}` : base;
      })();
      return NextResponse.redirect(target);
    }
  }

  const fallbackTarget = utmString ? `${origin}?error=auth_callback_error&${utmString}` : `${origin}?error=auth_callback_error`;
  return NextResponse.redirect(fallbackTarget);
}
