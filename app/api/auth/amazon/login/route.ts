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
    
    if (name === 'sid') {  // <-- change if your SESSION_COOKIE constant is different
      nextResponse.cookies.set({
        name,
        value,
        httpOnly: true,
        secure: false,        // localhost is HTTP
        sameSite: 'lax',      // localhost → localhost
        path: '/',
        maxAge: 300 * 1000,   // 5 min (matches backend TTL)
      });
    }
  });

  return nextResponse;
}
