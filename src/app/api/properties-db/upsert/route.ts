// API endpoint for n8n to upsert properties directly
import { NextRequest, NextResponse } from 'next/server';
import { PropertyDatabase } from '@/lib/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check API key for security
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Expect either a single property or array of properties
    const properties = Array.isArray(body) ? body : [body];

    console.log(`Upserting ${properties.length} properties via API`);

    // Transform and validate each property
    const transformedProperties = properties.map(prop => {
      // Auto-assign tier based on price if not provided
      let tier: 'public' | 'registered' | 'vip' = prop.tier || 'public';
      if (!prop.tier && prop.price) {
        const price = parseFloat(prop.price) || 0;
        if (price >= 1000000) {
          tier = 'vip';
        } else if (price >= 300000) {
          tier = 'registered';
        } else {
          tier = 'public';
        }
      }

      return {
        // Don't set id - let database generate UUID
        name: prop.name || 'Unnamed Property',
        address: prop.address || '',
        city: prop.city || '',
        state: prop.state || '',
        zipCode: prop.zip_code || prop.zipCode || '',
        price: parseFloat(prop.price) || 0,
        bedrooms: parseInt(prop.bedrooms) || 0,
        bathrooms: parseFloat(prop.bathrooms) || 0,
        squareFootage: parseInt(prop.square_footage || prop.squareFootage) || 0,
        lotSize: parseFloat(prop.lot_size || prop.lotSize) || 0,
        yearBuilt: parseInt(prop.year_built || prop.yearBuilt) || 0,
        propertyType: prop.property_type || prop.propertyType || 'Unknown',
        description: prop.description || '',
        status: prop.status || 'Active',
        images: Array.isArray(prop.images) ? prop.images :
                typeof prop.images === 'string' ? prop.images.split(',').map((url: string) => url.trim()).filter(Boolean) : [],
        tier,
        salesforceId: prop.salesforce_id || prop.id, // This is the unique constraint
        createdAt: prop.created_at || prop.created_date || prop.createdAt || new Date().toISOString(),
        updatedAt: prop.updated_at || prop.last_modified_date || prop.updatedAt || new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        // Transaction-specific fields for Salesforce sync
        leadSource: prop.lead_source || undefined,
        investmentPath: prop.investment_path || undefined,
        actualProfit: prop.actual_profit ? parseFloat(prop.actual_profit) : undefined,
        projectedProfit: prop.projected_profit ? parseFloat(prop.projected_profit) : undefined,
        salesDate: prop.sales_date || undefined,
        salesforceStatus: prop.salesforce_status || undefined
      };
    });

    // Upsert to database
    await PropertyDatabase.syncProperties(transformedProperties);
    await PropertyDatabase.updateSyncStatus();

    return NextResponse.json({
      success: true,
      message: `Successfully upserted ${transformedProperties.length} properties`,
      count: transformedProperties.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Property upsert API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to upsert properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to show API info
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/properties-db/upsert',
    method: 'POST',
    description: 'Upsert properties from external systems like n8n',
    authentication: 'Bearer token required (SYNC_API_KEY)',
    body_format: {
      single_property: {
        salesforce_id: 'string (required)',
        name: 'string',
        address: 'string',
        city: 'string',
        state: 'string',
        zip_code: 'string',
        price: 'number',
        bedrooms: 'number',
        bathrooms: 'number',
        square_footage: 'number',
        lot_size: 'number',
        year_built: 'number',
        property_type: 'string',
        description: 'string',
        status: 'string',
        images: 'array or comma-separated string',
        tier: 'public|registered|vip (optional, auto-assigned by price)'
      },
      multiple_properties: 'Array of property objects'
    }
  });
}