// API endpoint to manually trigger Salesforce sync
import { NextRequest, NextResponse } from 'next/server';
import { SalesforceSync } from '@/lib/sync-salesforce';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SYNC_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncService = new SalesforceSync();

    console.log('Starting manual Salesforce sync...');
    const result = await syncService.syncProperties();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${result.count} properties`,
        count: result.count,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Sync failed',
        errors: result.errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const syncService = new SalesforceSync();
    const connectionTest = await syncService.testConnection();

    return NextResponse.json({
      status: 'Sync API is running',
      salesforceConnection: connectionTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}