// Database configuration and connection
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy Supabase clients - only initialized when first used
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase environment variables not configured');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin environment variables not configured');
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}


// Property interface matching Salesforce data
export interface Property {
  id?: string; // Optional since database generates UUIDs
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  propertyType: string;
  description: string;
  status: string;
  images: string[];
  tier: 'public' | 'registered' | 'vip';
  salesforceId: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  // Transaction-specific fields for filtering
  leadSource?: string;
  investmentPath?: string;
  actualProfit?: number;
  projectedProfit?: number;
  salesDate?: string;
  salesforceStatus?: string;
}

// Database operations
export class PropertyDatabase {

  // Get all properties with optional tier filtering
  static async getProperties(tier?: string, limit: number = 50): Promise<Property[]> {
    let query = getSupabase()
      .from('properties')
      .select('*')
      .eq('status', 'Active')
      .or('investment_path.neq.Contract Cancelled/Lost,investment_path.is.null')
      .order('updated_at', { ascending: false });

    if (tier && tier !== 'public') {
      // For registered users, show public + registered
      // For VIP users, show all
      const allowedTiers = tier === 'vip'
        ? ['public', 'registered', 'vip']
        : ['public', 'registered'];

      query = query.in('tier', allowedTiers);
    } else {
      // Public users only see public properties
      query = query.eq('tier', 'public');
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching properties:', error);
      return [];
    }

    // Transform snake_case to camelCase for JavaScript
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      price: row.price,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      squareFootage: row.square_footage,
      lotSize: row.lot_size,
      yearBuilt: row.year_built,
      propertyType: row.property_type,
      description: row.description,
      status: row.status,
      images: row.images,
      tier: row.tier,
      salesforceId: row.salesforce_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastSyncedAt: row.last_synced_at,
      // Transaction-specific fields
      leadSource: row.lead_source,
      investmentPath: row.investment_path,
      actualProfit: row.actual_profit,
      projectedProfit: row.projected_profit,
      salesDate: row.sales_date,
      salesforceStatus: row.salesforce_status
    }));
  }

  // Get single property by ID
  static async getProperty(id: string): Promise<Property | null> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching property:', error);
      return null;
    }

    return data;
  }

  // Upsert properties from Salesforce sync
  static async syncProperties(properties: Property[]): Promise<void> {
    // Transform camelCase to snake_case for database
    const dbProperties = properties.map(prop => ({
      // Don't include id - let database generate UUID
      name: prop.name,
      address: prop.address,
      city: prop.city,
      state: prop.state,
      zip_code: prop.zipCode,
      price: prop.price,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      square_footage: prop.squareFootage,
      lot_size: prop.lotSize,
      year_built: prop.yearBuilt,
      property_type: prop.propertyType,
      description: prop.description,
      status: prop.status,
      images: prop.images,
      tier: prop.tier,
      salesforce_id: prop.salesforceId,
      created_at: prop.createdAt,
      updated_at: prop.updatedAt,
      last_synced_at: prop.lastSyncedAt,
      // Transaction-specific fields
      lead_source: prop.leadSource,
      investment_path: prop.investmentPath,
      actual_profit: prop.actualProfit,
      projected_profit: prop.projectedProfit,
      sales_date: prop.salesDate,
      salesforce_status: prop.salesforceStatus
    }));

    const { error } = await getSupabaseAdmin()
      .from('properties')
      .upsert(dbProperties, {
        onConflict: 'salesforce_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error syncing properties:', error);
      throw error;
    }

    console.log(`Synced ${properties.length} properties to database`);
  }

  // Get sync status
  static async getLastSyncTime(): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from('sync_status')
      .select('last_sync_at')
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is OK
      console.error('Error getting last sync time:', error);
    }

    return data?.last_sync_at || null;
  }

  // Update sync status
  static async updateSyncStatus(): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('sync_status')
      .upsert({
        id: 1,
        last_sync_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating sync status:', error);
    }
  }
}