import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

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
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/auth/login?error=auth_failed`,
      302
    );
  }

  const nextResponse = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/dashboard/dayparting`,
    302
  );

  nextResponse.cookies.set({
    name: 'sid',
    value: data.sessionId,
    httpOnly: true,
    secure: true,                          
    sameSite: 'lax',                        
    path: '/',
    domain: 'dayparting.beddora.com',      
    maxAge: 60 * 60 * 24 * 7,             
  });

  return nextResponse;
}