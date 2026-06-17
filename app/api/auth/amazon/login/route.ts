import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const EXPIRES_IN_30MIN = 30 * 60 * 1000;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/amazon/login`,
    {
      headers: { cookie: req.headers.get('cookie') || '' },
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: response.status }
    );
  }

  const data = await response.json();
  const nextResponse = NextResponse.json({ url: data.url });

  // Re-issue the backend's session cookie — now always a fresh session
  const rawCookies = response.headers.getSetCookie?.() || [];
  const isProd = process.env.NODE_ENV === 'production';

  rawCookies.forEach((raw) => {
    const [nameValue] = raw.split(';');
    const [name, value] = nameValue.split('=');

    nextResponse.cookies.set({
      name,
      value,
      httpOnly: true,
      sameSite: 'none',
      secure: isProd,
      path: '/',
      maxAge: EXPIRES_IN_30MIN,
      ...(isProd && { domain: 'dayparting.beddora.com' }),
    });
  });

  return nextResponse;
}