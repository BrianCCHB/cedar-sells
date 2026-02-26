// Salesforce to Database sync utility
import { SalesforceClient } from './salesforce';
import { PropertyDatabase, Property } from './database';

export class SalesforceSync {
  private salesforceClient: SalesforceClient;

  constructor() {
    this.salesforceClient = new SalesforceClient();
  }

  /**
   * Sync all properties from Salesforce to database
   */
  async syncProperties(): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log('Starting Salesforce sync...');

      // Authenticate with Salesforce using OAuth2 (we'll use service credentials)
      await this.authenticateService();

      // Fetch properties from Salesforce
      const salesforceProperties = await this.fetchSalesforceProperties();
      console.log(`Fetched ${salesforceProperties.length} properties from Salesforce`);

      if (salesforceProperties.length === 0) {
        return { success: true, count: 0, errors: ['No properties found in Salesforce'] };
      }

      // Transform Salesforce data to our database format
      const transformedProperties = this.transformProperties(salesforceProperties);

      // Sync to database
      await PropertyDatabase.syncProperties(transformedProperties);

      // Update sync status
      await PropertyDatabase.updateSyncStatus();

      console.log(`Successfully synced ${transformedProperties.length} properties`);

      return {
        success: true,
        count: transformedProperties.length,
        errors: []
      };

    } catch (error) {
      console.error('Sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        count: 0,
        errors
      };
    }
  }

  /**
   * Authenticate with Salesforce using service credentials (username/password flow)
   * This is for server-side sync operations, not user authentication
   */
  private async authenticateService(): Promise<void> {
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';

    if (!username || !password) {
      throw new Error('SALESFORCE_USERNAME and SALESFORCE_PASSWORD must be set for sync operations');
    }

    // Use username/password flow for service authentication
    await this.salesforceClient.authenticateWithCredentials(
      username,
      password + securityToken
    );
  }

  /**
   * Fetch properties from Salesforce
   */
  private async fetchSalesforceProperties(): Promise<any[]> {
    // SOQL query to get property data
    // Adjust fields based on your Salesforce Property object structure
    const query = `
      SELECT
        Id,
        Name,
        Address__c,
        City__c,
        State__c,
        Zip_Code__c,
        Price__c,
        Bedrooms__c,
        Bathrooms__c,
        Square_Footage__c,
        Lot_Size__c,
        Year_Built__c,
        Property_Type__c,
        Description__c,
        Status__c,
        Image_URLs__c,
        Tier__c,
        CreatedDate,
        LastModifiedDate
      FROM Property__c
      WHERE Status__c IN ('Active', 'Pending', 'Under Contract')
      ORDER BY LastModifiedDate DESC
    `;

    const result = await this.salesforceClient.query(query);
    return result.records || [];
  }

  /**
   * Transform Salesforce records to our database format
   */
  private transformProperties(salesforceRecords: any[]): Property[] {
    return salesforceRecords.map(record => {
      // Parse images from comma-separated string or JSON
      let images: string[] = [];
      if (record.Image_URLs__c) {
        try {
          // Try parsing as JSON first
          images = JSON.parse(record.Image_URLs__c);
        } catch {
          // Fallback to comma-separated string
          images = record.Image_URLs__c.split(',').map((url: string) => url.trim()).filter(Boolean);
        }
      }

      // Determine tier based on Salesforce field or property characteristics
      let tier: 'public' | 'registered' | 'vip' = 'public';
      if (record.Tier__c) {
        tier = record.Tier__c.toLowerCase();
      } else {
        // Auto-assign tier based on price
        const price = parseFloat(record.Price__c) || 0;
        if (price >= 1000000) {
          tier = 'vip';
        } else if (price >= 300000) {
          tier = 'registered';
        } else {
          tier = 'public';
        }
      }

      return {
        id: record.Id, // We'll use Salesforce ID as our ID
        name: record.Name || 'Unnamed Property',
        address: record.Address__c || '',
        city: record.City__c || '',
        state: record.State__c || '',
        zipCode: record.Zip_Code__c || '',
        price: parseFloat(record.Price__c) || 0,
        bedrooms: parseInt(record.Bedrooms__c) || 0,
        bathrooms: parseFloat(record.Bathrooms__c) || 0,
        squareFootage: parseInt(record.Square_Footage__c) || 0,
        lotSize: parseFloat(record.Lot_Size__c) || 0,
        yearBuilt: parseInt(record.Year_Built__c) || 0,
        propertyType: record.Property_Type__c || 'Unknown',
        description: record.Description__c || '',
        status: record.Status__c || 'Active',
        images,
        tier,
        salesforceId: record.Id,
        createdAt: record.CreatedDate,
        updatedAt: record.LastModifiedDate,
        lastSyncedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Test connection to Salesforce
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticateService();

      // Test with a simple query
      const result = await this.salesforceClient.query('SELECT Id FROM Property__c LIMIT 1');

      return {
        success: true,
        message: `Connected successfully. Found ${result.totalSize} property records.`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }
}