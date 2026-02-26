// Database-backed Properties API endpoint - Cedar Sells
import { NextRequest, NextResponse } from 'next/server';
import { PropertyDatabase } from '@/lib/database';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tier = searchParams.get('tier') || 'public';

    // Get user authentication status
    let userTier = 'public';
    try {
      // Try to get auth - but don't fail if Clerk middleware is disabled
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      if (userId) {
        userTier = 'registered'; // Default for logged-in users
        // TODO: Check user's actual subscription tier from database
      }
    } catch (error) {
      // Clerk not available or no auth - use public tier
      console.log('No authentication available, using public tier');
    }

    // Use the more restrictive tier (user's actual tier vs requested tier)
    const effectiveTier = userTier === 'vip' ? tier :
                         userTier === 'registered' && tier !== 'vip' ? tier :
                         'public';

    console.log(`Fetching properties for tier: ${effectiveTier} (user: ${userTier}, requested: ${tier})`);

    // Fetch properties from database
    const properties = await PropertyDatabase.getProperties(effectiveTier, limit, offset);

    // Get last sync time
    const lastSync = await PropertyDatabase.getLastSyncTime();

    // Return properties in the simple database format expected by React frontend
    const transformedProperties = properties;

    return NextResponse.json({
      success: true,
      data: {
        properties: transformedProperties,
        totalCount: transformedProperties.length,
        hasMore: transformedProperties.length === limit,
        tier: effectiveTier,
        lastSyncedAt: lastSync,
        source: 'database',
        message: `Serving ${transformedProperties.length} properties from database`
      }
    });

  } catch (error) {
    console.error('Database Properties API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch properties from database',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: {
        properties: [],
        totalCount: 0,
        hasMore: false
      }
    }, { status: 500 });
  }
}