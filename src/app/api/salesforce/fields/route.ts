// API route to explore fields in specific Salesforce objects

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const objectName = searchParams.get('object') || 'Left_Main__Property__c';

    // Get Salesforce tokens from cookies
    const accessToken = request.cookies.get('sf_access_token')?.value;
    const instanceUrl = request.cookies.get('sf_instance_url')?.value;

    if (!accessToken || !instanceUrl) {
      return NextResponse.json({
        success: false,
        error: 'No Salesforce tokens found. Please authenticate first.'
      });
    }

    console.log(`Querying fields for object: ${objectName}`);

    // Query for object fields
    const fieldsResponse = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/${objectName}/describe/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!fieldsResponse.ok) {
      const errorText = await fieldsResponse.text();
      console.error('Salesforce fields query failed:', errorText);
      return NextResponse.json({
        success: false,
        error: `Salesforce query failed: ${errorText}`
      });
    }

    const fieldsData = await fieldsResponse.json();

    // Filter and format relevant fields
    const relevantFields = fieldsData.fields.filter((field: any) =>
      field.type !== 'reference' ||
      field.name.toLowerCase().includes('owner') ||
      field.name.toLowerCase().includes('account') ||
      field.name.toLowerCase().includes('contact')
    ).map((field: any) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      length: field.length,
      required: !field.nillable,
      custom: field.custom,
      picklistValues: field.picklistValues?.map((pv: any) => pv.value)
    }));

    return NextResponse.json({
      success: true,
      data: {
        objectName: fieldsData.name,
        objectLabel: fieldsData.label,
        totalFields: fieldsData.fields.length,
        relevantFields
      }
    });

  } catch (error) {
    console.error('Error querying Salesforce fields:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query Salesforce fields',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}