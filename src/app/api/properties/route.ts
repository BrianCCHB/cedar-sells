// API route for fetching properties from Salesforce - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
// Note: Now using direct Salesforce API calls instead of salesforceClient
import { DealType, Market, AccessTier, Property, PropertyStatus } from '@/types';

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
    propertyType: 'Single Family', // Default property type
    status: 'Available' as PropertyStatus,
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
        altText: 'Property photo',
        order: 1,
      },
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
    flipMetrics: dealType === 'Fix & Flip' ? {
      arv: 95000, // After Repair Value
      rehabEstimate: 15000,
      spread: 5000, // ARV - (purchase price + rehab)
      roi: 15.4, // Return on Investment percentage
    } : undefined,
    rentalMetrics: dealType === 'Rental' ? {
      grossYield: 8.5, // Annual rental income / purchase price
      capRate: 7.2, // Net operating income / property value
      monthlyRent: 1200,
    } : undefined,
    isOffMarket: record.Left_Main__Dispo_Status__c === 'Closed/Won',
    accessTier: 'registered' as AccessTier,
    // Salesforce fields
    createdDate: record.CreatedDate ? new Date(record.CreatedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    updatedDate: record.LastModifiedDate ? new Date(record.LastModifiedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    ownerId: record.OwnerId || 'unknown',
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
    // const { userId } = await auth();
    const userId = null; // Temporarily disable auth for demo
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

    // Check for OAuth2 tokens in cookies
    const accessToken = request.cookies.get('sf_access_token')?.value;
    const refreshToken = request.cookies.get('sf_refresh_token')?.value;
    const instanceUrl = request.cookies.get('sf_instance_url')?.value;

    // Try to use Salesforce client directly first
    try {
      const { salesforceClient } = await import('@/lib/salesforce');

      // If we have OAuth2 tokens, use them
      if (accessToken && refreshToken && instanceUrl) {
        salesforceClient.setTokensFromCookies(accessToken, refreshToken, instanceUrl);
      }

      const salesforceData = await salesforceClient.queryTransactions({
        dealTypes: dealTypes as any,
        markets: markets as any,
        limit,
        offset
      });

      if (salesforceData.records && salesforceData.records.length > 0) {
        const properties = salesforceData.records.map((record: any) => ({
          id: record.Id,
          title: record.Name || `Property ${record.Id}`,
          dealType: 'Wholesale' as DealType, // Default since we don't have Deal_Type__c
          market: 'lafayette' as Market, // Default market
          listPrice: 75000, // Default price
          propertyType: 'Single Family',
          status: 'Available' as PropertyStatus,
          address: {
            street: record.Left_Main__Street_Address__c || 'Address Not Available',
            city: record.Left_Main__City__c || 'Lafayette',
            state: record.Left_Main__State__c || 'LA',
            zipCode: record.Left_Main__Zipcode__c || '',
            parish: 'Lafayette',
          },
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          lotSize: 0.25,
          yearBuilt: 1990,
          description: `Real estate investment opportunity. ${record.Left_Main__Dispo_Status__c ? `Status: ${record.Left_Main__Dispo_Status__c}` : ''}`,
          images: [
            {
              id: `${record.Id}-1`,
              url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
              altText: 'Property photo',
              order: 1,
            },
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
          isOffMarket: false,
          accessTier: 'public' as AccessTier,
          createdDate: record.CreatedDate ? new Date(record.CreatedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedDate: record.LastModifiedDate ? new Date(record.LastModifiedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          ownerId: record.OwnerId || 'cedar-sells',
        }));

        return NextResponse.json({
          success: true,
          data: {
            properties,
            totalCount: salesforceData.totalSize,
            hasMore: !salesforceData.done,
            message: 'Live data from Salesforce'
          },
        });
      }
    } catch (salesforceError) {
      console.error('Salesforce client error:', salesforceError);
      // Fall through to mock data
    }

    // If Salesforce client failed, fall back to mock data
    if (!accessToken || !instanceUrl) {
      // Fall back to mock data if no Salesforce tokens
      console.log('No Salesforce tokens found, using mock data');

      // Create sample properties for demo
      const sampleProperties: Property[] = [
        {
          id: 'sample-1',
          title: '123 Oak Street, Lafayette',
          dealType: 'Fix & Flip' as DealType,
          market: 'lafayette' as Market,
          listPrice: 75000,
          propertyType: 'Single Family',
          status: 'Available' as PropertyStatus,
          address: {
            street: '123 Oak Street',
            city: 'Lafayette',
            state: 'LA',
            zipCode: '70501',
            parish: 'Lafayette',
          },
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          lotSize: 0.25,
          yearBuilt: 1990,
          description: 'Great investment property in desirable Lafayette neighborhood. Perfect for fix and flip opportunity.',
          images: [
            {
              id: 'sample-1-1',
              url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
              altText: 'Property photo',
              order: 1,
            },
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
          flipMetrics: {
            arv: 95000,
            rehabEstimate: 15000,
            spread: 5000,
            roi: 15.4,
          },
          isOffMarket: false,
          accessTier: 'public' as AccessTier,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          ownerId: 'cedar-sells',
        },
        {
          id: 'sample-2',
          title: '456 Pine Avenue, Baton Rouge',
          dealType: 'Rental' as DealType,
          market: 'baton-rouge' as Market,
          listPrice: 120000,
          propertyType: 'Single Family',
          status: 'Available' as PropertyStatus,
          address: {
            street: '456 Pine Avenue',
            city: 'Baton Rouge',
            state: 'LA',
            zipCode: '70802',
            parish: 'East Baton Rouge',
          },
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1400,
          lotSize: 0.30,
          yearBuilt: 2005,
          description: 'Excellent rental property in growing Baton Rouge area. Currently rented at market rate.',
          images: [
            {
              id: 'sample-2-1',
              url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
              altText: 'Property photo',
              order: 1,
            },
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
          rentalMetrics: {
            grossYield: 8.5,
            capRate: 7.2,
            monthlyRent: 1200,
          },
          isOffMarket: false,
          accessTier: 'public' as AccessTier,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          ownerId: 'cedar-sells',
        },
        {
          id: 'sample-3',
          title: '789 Cypress Lane, Lafayette',
          dealType: 'Wholesale' as DealType,
          market: 'lafayette' as Market,
          listPrice: 65000,
          propertyType: 'Single Family',
          status: 'Available' as PropertyStatus,
          address: {
            street: '789 Cypress Lane',
            city: 'Lafayette',
            state: 'LA',
            zipCode: '70503',
            parish: 'Lafayette',
          },
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          lotSize: 0.20,
          yearBuilt: 1985,
          description: 'Wholesale opportunity in Lafayette. Quick close available for cash buyers.',
          images: [
            {
              id: 'sample-3-1',
              url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
              altText: 'Property photo',
              order: 1,
            },
          ],
          thumbnailUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
          isOffMarket: false,
          accessTier: 'public' as AccessTier,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          ownerId: 'cedar-sells',
        },
      ];

      // Apply filters to sample data
      let filteredProperties = sampleProperties;

      if (dealTypes.length > 0) {
        filteredProperties = filteredProperties.filter(prop => dealTypes.includes(prop.dealType));
      }

      if (markets.length > 0) {
        filteredProperties = filteredProperties.filter(prop => markets.includes(prop.market));
      }

      return NextResponse.json({
        success: true,
        data: {
          properties: filteredProperties.slice(offset, offset + limit),
          totalCount: filteredProperties.length,
          hasMore: (offset + limit) < filteredProperties.length,
          message: 'Demo properties - Connect Salesforce for live data'
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
        properties = properties.filter((property: Property) => dealTypes.includes(property.dealType));
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