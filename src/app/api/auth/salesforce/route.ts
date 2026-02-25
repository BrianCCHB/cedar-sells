// Salesforce OAuth2 authorization endpoint - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get('redirect') || '/listings';

  // Store redirect URI in a cookie for after auth
  const response = NextResponse.redirect(getSalesforceAuthUrl());
  response.cookies.set('sf_redirect_uri', redirectUri, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutes
  });

  return response;
}

function getSalesforceAuthUrl(): string {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production'
    ? 'https://cedar-property-listings.vercel.app/api/auth/salesforce/callback'
    : 'http://localhost:3000/api/auth/salesforce/callback';

  const baseUrl = 'https://cedarproperties.my.salesforce.com/services/oauth2/authorize';

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId || '',
    redirect_uri: redirectUri,
    scope: 'api refresh_token',
    state: generateRandomState()
  });

  return `${baseUrl}?${params.toString()}`;
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}