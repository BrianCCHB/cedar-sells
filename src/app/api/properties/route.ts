// API route for fetching properties from Salesforce - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Note: Now using direct Salesforce API calls instead of salesforceClient
import { DealType, Market, AccessTier, Property } from '@/types';

// Transform Salesforce Left_Main__Transactions__c record to Property interface
function transformSalesforceRecord(record: any): Property {
  // Determine deal type - default to wholesale for now
  let dealType = 'Wholesale';

  // Get property address components from real Salesforce fields
  const street = record.Left_Main__Street_Address__c || 'Address Not Available';
  const city = record.Left_Main__City__c || 'City Not Available';
  const state = record.Left_Main__State__c || 'LA';
  const zipCode = record.Left_Main__Zipcode__c || '';

  return {
    id: record.Id,
    title: record.Name || `${street}, ${city}` || 'Property Listing',
    dealType: dealType as DealType,
    market: getMarketFromCity(city) as Market,
    listPrice: 0, // Hidden for now - placeholder
    address: {
      street,
      city,
      state,
      zipCode,
      parish: getParishFromCity(city),
    },
    bedrooms: 3, // Default values since not in Transactions object
    bathrooms: 2,
    squareFeet: 1200,
    lotSize: 0.25,
    yearBuilt: 1990,
    description: `Investment property in ${city}. ${record.Left_Main__Dispo_Status__c ? `Status: ${record.Left_Main__Dispo_Status__c}` : ''}`,
    images: [
      {
        id: `${record.Id}-1`,
        url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        alt: 'Property photo',
        order: 1,
      },
    ],
    flipMetrics: dealType === 'flip' ? {
      purchasePrice: 50000,
      estimatedRehabCost: 15000,
      afterRepairValue: 95000,
      spread: 5000,
      estimatedTimeline: 90,
    } : undefined,
    rentalMetrics: dealType === 'rental' ? {
      monthlyRent: 1200, // Default estimate
      annualRent: 14400,
      capRate: 8.5,
      cashFlow: 400,
      expenses: {
        insurance: 100,
        taxes: 200,
        maintenance: 200,
      },
    } : undefined,
    isActive: true, // Default to active
    isOffMarket: record.Left_Main__Dispo_Status__c === 'Closed/Won',
    accessTier: 'registered' as AccessTier,
    postedDate: record.CreatedDate ? new Date(record.CreatedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    updatedDate: record.LastModifiedDate ? new Date(record.LastModifiedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// Helper function to map cities to parishes
function getParishFromCity(city: string): string {
  const cityParishMap: { [key: string]: string } = {
    'lafayette': 'Lafayette',
    'baton rouge': 'East Baton Rouge',
    'new orleans': 'Orleans',
    'shreveport': 'Caddo',
    'lake charles': 'Calcasieu',
    'monroe': 'Ouachita',
    'alexandria': 'Rapides',
  };
  return cityParishMap[city.toLowerCase()] || 'Lafayette';
}

// Helper function to map cities to markets
function getMarketFromCity(city: string): string {
  const cityMarketMap: { [key: string]: string } = {
    'lafayette': 'lafayette',
    'baton rouge': 'baton-rouge',
    'new orleans': 'new-orleans',
    'shreveport': 'shreveport',
    'lake charles': 'lake-charles',
    'monroe': 'monroe',
    'alexandria': 'alexandria',
  };
  return cityMarketMap[city.toLowerCase()] || 'lafayette';
}

// Helper function to calculate cap rate
function calculateCapRate(monthlyRent: number, purchasePrice: number): number {
  if (purchasePrice === 0) return 0;
  const annualRent = monthlyRent * 12;
  const annualExpenses = monthlyRent * 12 * 0.35; // Estimate 35% expenses
  const netIncome = annualRent - annualExpenses;
  return (netIncome / purchasePrice) * 100;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const dealTypes = searchParams.get('dealTypes')?.split(',') as DealType[] || [];
    const markets = searchParams.get('markets')?.split(',') as Market[] || [];
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Determine user's access tier
    let accessTier: AccessTier = 'public';
    if (userId) {
      // In a real implementation, you'd check the user's tier from their metadata
      // For now, assume registered users get 'registered' access
      accessTier = 'registered';

      // Check if user is VIP (you'd implement this logic based on your business rules)
      // For example, check user metadata or Salesforce Lead record
      const isVip = false; // Implement VIP check logic
      if (isVip) {
        accessTier = 'vip';
      }
    }

    // Get Salesforce tokens from cookies
    const accessToken = request.cookies.get('sf_access_token')?.value;
    const instanceUrl = request.cookies.get('sf_instance_url')?.value;

    if (!accessToken || !instanceUrl) {
      // Fall back to mock data if no Salesforce tokens
      console.log('No Salesforce tokens found, using mock data');
      return NextResponse.json({
        success: true,
        data: {
          properties: [],
          totalCount: 0,
          hasMore: false,
          message: 'Please authenticate with Salesforce to view properties'
        },
      });
    }

    // Query Salesforce for Left_Main__Transactions__c records
    try {
      let soqlQuery = `
        SELECT Id, Name, Left_Main__Street_Address__c, Left_Main__City__c,
               Left_Main__State__c, Left_Main__Zipcode__c,
               Left_Main__Dispo_Status__c, Left_Main__Contract_Purchase_Price__c,
               CreatedDate, LastModifiedDate
        FROM Left_Main__Transactions__c
        WHERE Left_Main__Dispo_Status__c != null
        AND Left_Main__Dispo_Status__c != 'Flip'
        AND Left_Main__Dispo_Status__c != 'Rental'
      `;

      // Add filters based on available fields
      if (markets.length > 0) {
        // Filter by city since we don't have Market__c field
        const cityFilter = markets.map(m => {
          // Convert market to city name
          const marketToCityMap: { [key: string]: string } = {
            'lafayette': 'Lafayette',
            'baton-rouge': 'Baton Rouge',
            'new-orleans': 'New Orleans',
            'shreveport': 'Shreveport',
            'lake-charles': 'Lake Charles',
            'monroe': 'Monroe',
            'alexandria': 'Alexandria',
          };
          return `'${marketToCityMap[m] || m}'`;
        }).join(',');
        soqlQuery += ` AND Left_Main__City__c IN (${cityFilter})`;
      }

      // Note: Deal type filtering will be done after data retrieval since we don't have a Deal_Type__c field

      soqlQuery += ` ORDER BY LastModifiedDate DESC LIMIT ${limit} OFFSET ${offset}`;

      console.log('Executing Salesforce query:', soqlQuery);

      const salesforceResponse = await fetch(`${instanceUrl}/services/data/v58.0/query/?q=${encodeURIComponent(soqlQuery)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!salesforceResponse.ok) {
        const errorText = await salesforceResponse.text();
        console.error('Salesforce query failed:', errorText);
        throw new Error(`Salesforce query failed: ${errorText}`);
      }

      const salesforceData = await salesforceResponse.json();
      console.log('Salesforce query successful:', salesforceData.totalSize, 'records found');

      // Transform Salesforce records to our Property interface
      let properties = salesforceData.records.map((record: any) => transformSalesforceRecord(record));

      // Apply client-side filtering for deal types since it's not available in the object
      if (dealTypes.length > 0) {
        properties = properties.filter(property => dealTypes.includes(property.dealType));
      }

      return NextResponse.json({
        success: true,
        data: {
          properties,
          totalCount: properties.length, // Use filtered count
          hasMore: !salesforceData.done,
          nextCursor: salesforceData.nextRecordsUrl?.split('/')?.pop(),
        },
      });

    } catch (salesforceError) {
      console.error('Error querying Salesforce:', salesforceError);
      // Fall back to empty result
      return NextResponse.json({
        success: true,
        data: {
          properties: [],
          totalCount: 0,
          hasMore: false,
          error: 'Unable to fetch properties from Salesforce'
        },
      });
    }

  } catch (error) {
    console.error('Error fetching properties:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch properties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}