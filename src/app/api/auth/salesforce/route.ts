// Salesforce OAuth2 authorization endpoint - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect') || '/listings';

  // Generate PKCE challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store redirect URI and code verifier in cookies for after auth
  const authUrl = getSalesforceAuthUrl(codeChallenge);
  const response = NextResponse.redirect(authUrl);

  response.cookies.set('sf_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  });

  response.cookies.set('sf_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  });

  return response;
}

function getSalesforceAuthUrl(codeChallenge: string): string {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://cedar-property-listings.vercel.app/api/auth/salesforce/callback'
    : 'http://localhost:3000/api/auth/salesforce/callback';

  const baseUrl = 'https://cedarproperties.my.salesforce.com/services/oauth2/authorize';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'full refresh_token',
    state: generateRandomState(),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return `${baseUrl}?${params.toString()}`;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}