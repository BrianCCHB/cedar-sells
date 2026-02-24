// API route to explore available Salesforce objects

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get Salesforce tokens from cookies
    const accessToken = request.cookies.get('sf_access_token')?.value;
    const instanceUrl = request.cookies.get('sf_instance_url')?.value;

    if (!accessToken || !instanceUrl) {
      return NextResponse.json({
        success: false,
        error: 'No Salesforce tokens found. Please authenticate first.'
      });
    }

    console.log('Querying Salesforce objects...');

    // Query for all objects
    const objectsResponse = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!objectsResponse.ok) {
      const errorText = await objectsResponse.text();
      console.error('Salesforce objects query failed:', errorText);
      return NextResponse.json({
        success: false,
        error: `Salesforce query failed: ${errorText}`
      });
    }

    const objectsData = await objectsResponse.json();

    // Filter for potentially relevant objects
    const relevantObjects = objectsData.sobjects.filter((obj: any) =>
      obj.name.toLowerCase().includes('transaction') ||
      obj.name.toLowerCase().includes('property') ||
      obj.name.toLowerCase().includes('deal') ||
      obj.name.toLowerCase().includes('listing') ||
      obj.name.toLowerCase().includes('opportunity') ||
      obj.name.toLowerCase().includes('account') ||
      obj.name.toLowerCase().includes('contact') ||
      obj.name.toLowerCase().includes('lead') ||
      obj.custom === true
    );

    return NextResponse.json({
      success: true,
      data: {
        totalObjects: objectsData.sobjects.length,
        relevantObjects: relevantObjects.map((obj: any) => ({
          name: obj.name,
          label: obj.label,
          custom: obj.custom,
          createable: obj.createable,
          queryable: obj.queryable
        }))
      }
    });

  } catch (error) {
    console.error('Error querying Salesforce objects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query Salesforce objects',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}