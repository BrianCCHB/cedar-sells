// Salesforce REST API connection utilities for Cedar Sells

import { SalesforceTransaction, PropertyFromSalesforce, PropertyImage, Property } from '@/types';

interface SalesforceAuthResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

interface SalesforceQueryResponse<T> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

class SalesforceClient {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private tokenExpiry: number = 0;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly securityToken: string;

  constructor() {
    this.clientId = process.env.SALESFORCE_CLIENT_ID || '';
    this.clientSecret = process.env.SALESFORCE_CLIENT_SECRET || '';
    this.username = process.env.SALESFORCE_USERNAME || '';
    this.password = process.env.SALESFORCE_PASSWORD || '';
    this.securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';
  }

  private async authenticate(): Promise<void> {
    const authUrl = 'https://login.salesforce.com/services/oauth2/token';

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: this.username,
      password: this.password + this.securityToken,
    });

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Salesforce authentication failed: ${error}`);
      }

      const authData: SalesforceAuthResponse = await response.json();

      this.accessToken = authData.access_token;
      this.instanceUrl = authData.instance_url;
      // Set token expiry to 1.5 hours from now (Salesforce tokens typically expire in 2 hours)
      this.tokenExpiry = Date.now() + (1.5 * 60 * 60 * 1000);

    } catch (error) {
      console.error('Salesforce authentication error:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    // Check if credentials are configured
    if (!this.clientId || !this.clientSecret || !this.username || !this.password) {
      throw new Error('Salesforce credentials not configured. Please set SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_USERNAME, and SALESFORCE_PASSWORD environment variables.');
    }

    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.instanceUrl}/services/data/v58.0${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce API error: ${error}`);
    }

    return response.json();
  }

  // Query transactions with pagination and filtering
  async queryTransactions(
    filters: {
      dealTypes?: string[];
      markets?: string[];
      accessTier?: string;
      isOffMarket?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SalesforceQueryResponse<SalesforceTransaction>> {
    const {
      dealTypes = [],
      markets = [],
      accessTier,
      isOffMarket,
      limit = 20,
      offset = 0
    } = filters;

    let whereClause = "WHERE Status__c != 'Sold'"; // Only show available properties

    if (dealTypes.length > 0) {
      const dealTypeFilter = dealTypes.map(dt => `'${dt}'`).join(',');
      whereClause += ` AND Deal_Type__c IN (${dealTypeFilter})`;
    }

    if (markets.length > 0) {
      const marketFilter = markets.map(m => `'${m}'`).join(',');
      whereClause += ` AND Market__c IN (${marketFilter})`;
    }

    if (accessTier) {
      whereClause += ` AND Access_Tier__c = '${accessTier}'`;
    }

    if (typeof isOffMarket === 'boolean') {
      whereClause += ` AND Is_Off_Market__c = ${isOffMarket}`;
    }

    const query = `
      SELECT
        Id, Name, Description__c, Street_Address__c, City__c, State__c,
        Zip_Code__c, Parish__c, Bedrooms__c, Bathrooms__c, Square_Feet__c,
        Lot_Size__c, Year_Built__c, Property_Type__c, Deal_Type__c, Market__c,
        List_Price__c, Purchase_Price__c, Status__c, Access_Tier__c,
        Is_Off_Market__c, ARV__c, Rehab_Estimate__c, Spread__c, ROI__c,
        Gross_Yield__c, Cap_Rate__c, Monthly_Rent__c, CreatedDate,
        LastModifiedDate, OwnerId, Tags__c, Notes__c, Showing_Instructions__c
      FROM Transaction__c
      ${whereClause}
      ORDER BY CreatedDate DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return this.makeRequest(`/query/?q=${encodeURIComponent(query)}`);
  }

  // Get a single transaction by ID
  async getTransaction(id: string): Promise<SalesforceTransaction> {
    const endpoint = `/sobjects/Transaction__c/${id}`;
    return this.makeRequest(endpoint);
  }

  // Create a new Lead in Salesforce
  async createLead(leadData: {
    FirstName: string;
    LastName: string;
    Email: string;
    Phone?: string;
    Company?: string;
    LeadSource: string;
    Status: string;
    Investor_Type__c?: string;
    Interests__c?: string;
    Website_User_ID__c: string;
  }): Promise<{ id: string; success: boolean; errors: any[] }> {
    const endpoint = '/sobjects/Lead/';

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });

    return response as { id: string; success: boolean; errors: any[] };
  }

  // Update Lead with additional information
  async updateLead(leadId: string, updateData: Partial<any>): Promise<void> {
    const endpoint = `/sobjects/Lead/${leadId}`;

    await this.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }
}

// Transform Salesforce Transaction to our Property interface
export const transformSalesforceTransaction: PropertyFromSalesforce = (
  transaction: SalesforceTransaction,
  images: PropertyImage[] = []
): Property => {
  return {
    id: transaction.Id,
    title: transaction.Name,
    description: transaction.Description__c || '',
    address: {
      street: transaction.Street_Address__c,
      city: transaction.City__c,
      state: transaction.State__c,
      zipCode: transaction.Zip_Code__c,
      parish: transaction.Parish__c,
    },
    bedrooms: transaction.Bedrooms__c,
    bathrooms: transaction.Bathrooms__c,
    squareFeet: transaction.Square_Feet__c,
    lotSize: transaction.Lot_Size__c,
    yearBuilt: transaction.Year_Built__c,
    propertyType: transaction.Property_Type__c,
    dealType: transaction.Deal_Type__c,
    market: transaction.Market__c,
    listPrice: transaction.List_Price__c,
    purchasePrice: transaction.Purchase_Price__c,
    status: transaction.Status__c,
    accessTier: transaction.Access_Tier__c,
    isOffMarket: transaction.Is_Off_Market__c || false,
    images,
    thumbnailUrl: images.length > 0 ? images[0].url : '/placeholder-house.jpg',
    flipMetrics: transaction.Deal_Type__c === 'Fix & Flip' ? {
      arv: transaction.ARV__c || 0,
      rehabEstimate: transaction.Rehab_Estimate__c || 0,
      spread: transaction.Spread__c || 0,
      roi: transaction.ROI__c || 0,
    } : undefined,
    rentalMetrics: transaction.Deal_Type__c === 'Rental' ? {
      grossYield: transaction.Gross_Yield__c || 0,
      capRate: transaction.Cap_Rate__c || 0,
      monthlyRent: transaction.Monthly_Rent__c,
    } : undefined,
    createdDate: transaction.CreatedDate,
    updatedDate: transaction.LastModifiedDate,
    ownerId: transaction.OwnerId,
    tags: transaction.Tags__c ? transaction.Tags__c.split(',').map(t => t.trim()) : undefined,
    notes: transaction.Notes__c,
    showingInstructions: transaction.Showing_Instructions__c,
  };
};

// Singleton instance
export const salesforceClient = new SalesforceClient();

// Export utility functions
export { SalesforceClient };
export type { SalesforceQueryResponse };