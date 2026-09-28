import { NextRequest, NextResponse } from 'next/server';

/**
 * Browser stays on /studio/*, but we render the real storefront routes underneath
 * so Studio is a 1:1 mirror of every shop page.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/studio/login' || pathname.startsWith('/studio/login/')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  if (pathname === '/studio' || pathname === '/studio/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  if (pathname.startsWith('/studio/')) {
    const shopPath = pathname.slice('/studio'.length) || '/';
    const url = request.nextUrl.clone();
    url.pathname = shopPath;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio', '/studio/:path*'],
};
