import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const EXPIRES_IN_30DAYS =  60 * 60 * 24 * 30 * 1000;
  const backendUrl = new URL(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/amazon/callback`
  );
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const response = await fetch(backendUrl.toString(), {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
    },
  });
  
  const data = await response.json();
  if (!data.success || !data.sessionId) {
    const errorCode = data.error || 'auth_failed';
    const errorMessage = encodeURIComponent(data.message || 'Authentication failed');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/?error=${errorCode}&message=${errorMessage}`,
      302
    );
  }

  const nextResponse = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/dashboard/dayparting`,
    302
  );

  const isProd = process.env.NODE_ENV === 'production';
  
  nextResponse.cookies.set({
    name: 'sid',
    value: data.sessionId,
    httpOnly: true,
    secure: isProd,        // false locally, true in production
    sameSite: 'lax',       // lax works for both local and same-site subdomains
    path: '/',
    ...(isProd && { domain: 'dayparting.beddora.com' }),
    maxAge: EXPIRES_IN_30DAYS,
  });

  return nextResponse;
}