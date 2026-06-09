import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('Backend response status:');
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/amazon/login`,
    {
      headers: { cookie: req.headers.get('cookie') || '' },
    }
  );
  console.log('Backend response status:', response);
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: response.status }
    );
  }

  const data = await response.json();
  const nextResponse = NextResponse.json({ url: data.url });

  // Re-issue the backend's session cookie for LOCALHOST
  const rawCookies = response.headers.getSetCookie?.() || [];
  rawCookies.forEach((raw) => {
    const [nameValue] = raw.split(';');
    const [name, value] = nameValue.split('=');
    
      const isProd = process.env.NODE_ENV === 'production';

      nextResponse.cookies.set({
        name,
        value,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 300 * 1000,
        ...(isProd && { domain: 'dayparting.beddora.com' }),
      });
  });

  return nextResponse;
}
