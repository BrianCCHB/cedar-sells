// Salesforce OAuth2 callback handler - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Salesforce OAuth error:', error);
    return NextResponse.redirect(new URL('/listings?error=auth_failed', request.url));
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/listings?error=no_code', request.url));
  }

  try {
    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('sf_code_verifier')?.value;
    if (!codeVerifier) {
      console.error('No code verifier found in cookies');
      return NextResponse.redirect(new URL('/listings?error=no_verifier', request.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

    // Get redirect URI from cookie
    const redirectUri = request.cookies.get('sf_redirect_uri')?.value || '/listings';

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectUri, request.url));

    // Set secure cookies for tokens
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set('sf_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    response.cookies.set('sf_refresh_token', tokenResponse.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    response.cookies.set('sf_instance_url', tokenResponse.instance_url, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    // Clear the redirect URI and code verifier cookies
    response.cookies.delete('sf_redirect_uri');
    response.cookies.delete('sf_code_verifier');

    return response;

  } catch (error) {
    console.error('Token exchange failed:', error);
    return NextResponse.redirect(new URL('/listings?error=token_exchange_failed', request.url));
  }
}

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://cedar-property-listings.vercel.app/api/auth/salesforce/callback'
    : 'http://localhost:3000/api/auth/salesforce/callback';

  const tokenUrl = 'https://cedarproperties.my.salesforce.com/services/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId || '',
    client_secret: clientSecret || '',
    redirect_uri: redirectUri,
    code: code,
    code_verifier: codeVerifier
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}
