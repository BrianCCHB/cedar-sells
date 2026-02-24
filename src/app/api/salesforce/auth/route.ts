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
    // Exchange authorization code for access token
    const tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/salesforce/auth`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: callbackUrl,
      code: code,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/listings?error=token_exchange_failed', request.url));
    }

    const tokenData = await response.json();

    // Store tokens securely (in a real app, you'd store this in a database or secure session)
    // For this demo, we'll store in environment variables or session storage
    console.log('Salesforce authentication successful:', {
      access_token: tokenData.access_token.substring(0, 20) + '...',
      instance_url: tokenData.instance_url,
    });

    // In a production app, you'd store these tokens securely for the user
    // For now, we'll just redirect to success
    return NextResponse.redirect(new URL('/listings?salesforce_connected=true', request.url));

  } catch (error) {
    console.error('Error during token exchange:', error);
    return NextResponse.redirect(new URL('/listings?error=auth_server_error', request.url));
  }
}