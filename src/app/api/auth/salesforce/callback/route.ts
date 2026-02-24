// Salesforce OAuth Web Server Flow authentication handler

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Salesforce OAuth error:', error);
    return NextResponse.redirect(new URL('/listings?error=salesforce_auth_failed', request.url));
  }

  if (!code) {
    console.error('No authorization code received from Salesforce');
    return NextResponse.redirect(new URL('/listings?error=no_auth_code', request.url));
  }

  try {
    // Get PKCE code verifier from cookie
    const codeVerifier = request.cookies.get('pkce_verifier')?.value;

    if (!codeVerifier) {
      console.error('Missing PKCE code verifier');
      return NextResponse.redirect(new URL('/listings?error=missing_verifier', request.url));
    }

    // Exchange authorization code for access token
    const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
    const callbackUrl = 'https://216a-76-72-80-29.ngrok-free.app/api/auth/salesforce/callback';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: callbackUrl,
      code: code,
      code_verifier: codeVerifier,
    });

    const fetchResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/listings?error=token_exchange_failed', request.url));
    }

    const tokenData = await fetchResponse.json();

    // Store tokens securely (in a real app, you'd store this in a database or secure session)
    console.log('Salesforce authentication successful:', {
      access_token: tokenData.access_token.substring(0, 20) + '...',
      instance_url: tokenData.instance_url,
    });

    // Create a response that stores tokens in secure cookies for this demo
    const redirectResponse = NextResponse.redirect(new URL('/listings?salesforce_connected=true', request.url));

    // Store tokens in secure HttpOnly cookies (for demo purposes)
    redirectResponse.cookies.set('sf_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 7200, // 2 hours (Salesforce token expiry)
      path: '/'
    });

    redirectResponse.cookies.set('sf_instance_url', tokenData.instance_url, {
      httpOnly: true,
      secure: true,
      maxAge: 7200,
      path: '/'
    });

    if (tokenData.refresh_token) {
      redirectResponse.cookies.set('sf_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 86400 * 30, // 30 days
        path: '/'
      });
    }

    return redirectResponse;

  } catch (error) {
    console.error('Error during token exchange:', error);
    return NextResponse.redirect(new URL('/listings?error=auth_server_error', request.url));
  }
}