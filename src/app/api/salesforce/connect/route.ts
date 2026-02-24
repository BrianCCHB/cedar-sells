// Initiate Salesforce OAuth Web Server Flow

import { NextRequest, NextResponse } from 'next/server';
import { webcrypto } from 'crypto';

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  webcrypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await webcrypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

function base64URLEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const callbackUrl = 'https://216a-76-72-80-29.ngrok-free.app/api/auth/salesforce/callback';

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Salesforce OAuth authorization URL
    const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.SALESFORCE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'full refresh_token');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Optional: Add state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    authUrl.searchParams.set('state', state);

    console.log('Redirecting to Salesforce OAuth URL:', authUrl.toString());

    // Create redirect response and store code verifier in cookie
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('pkce_verifier', codeVerifier, {
      httpOnly: true,
      secure: true,
      maxAge: 600 // 10 minutes
    });

    return response;

  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}