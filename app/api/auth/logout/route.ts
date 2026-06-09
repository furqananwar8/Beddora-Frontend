import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 1. Call backend to invalidate the session server-side
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') || '' },
    });
  } catch (e) {
    // Even if backend logout fails, still clear the local cookie
    console.error('Backend logout failed:', e);
  }

  // 2. Clear the sid cookie by re-setting it with maxAge: 0
  //    MUST use the same name, path, sameSite, and secure values
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'sid',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true on your live HTTPS domain
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // <-- expires immediately
  });

  return response;
}