// app/api/auth/amazon/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';



export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);



  // Forward the exact query params to your backend

  const backendUrl = new URL(

    'https://obeyable-isothermally-kelly.ngrok-free.dev/api/auth/amazon/callback'

  );

  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));



  const response = await fetch(backendUrl.toString(), {

    method: 'GET',

    headers: {

      cookie: req.headers.get('cookie') || '',

    },

    redirect: 'manual', // Don't auto-follow redirects

  });



  // Create a new response to the browser

  const nextResponse = NextResponse.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_BASE_URL}/dashboard/dayparting`,
    302
  );



  // CRITICAL: Copy Set-Cookie headers from backend to frontend response

  const setCookieHeaders = response.headers.getSetCookie?.() ||

    response.headers.get('set-cookie')?.split(', ') || [];



  setCookieHeaders.forEach((cookie) => {

    nextResponse.headers.append('Set-Cookie', cookie);

  });



  return nextResponse;

}