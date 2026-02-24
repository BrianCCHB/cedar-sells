// Property and Transaction types for Cedar Cash Home Buyers

export type DealType = 'Fix & Flip' | 'Wholesale' | 'Rental';
export type Market = 'Lafayette' | 'Baton Rouge' | 'Other';
export type AccessTier = 'public' | 'registered' | 'vip';
export type PropertyStatus = 'Available' | 'Under Contract' | 'Sold' | 'Off Market';

export interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
  order: number;
}

export interface FlipMetrics {
  arv: number; // After Repair Value
  rehabEstimate: number;
  spread: number; // ARV - (purchase price + rehab)
  roi: number; // Return on Investment percentage
}

export interface RentalMetrics {
  grossYield: number; // Annual rental income / purchase price
  capRate: number; // Net operating income / property value
  monthlyRent?: number;
}

// Main property interface matching Salesforce Transaction object
export interface Property {
  id: string;

  // Basic property info
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    parish: string;
  };

  // Property details
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: string; // Single Family, Duplex, etc.

  // Deal information
  dealType: DealType;
  market: Market;
  listPrice: number;
  purchasePrice?: number;
  status: PropertyStatus;

  // Access control
  accessTier: AccessTier;
  isOffMarket: boolean;

  // Images
  images: PropertyImage[];
  thumbnailUrl: string;

  // Deal metrics (conditional based on deal type)
  flipMetrics?: FlipMetrics;
  rentalMetrics?: RentalMetrics;

  // Salesforce fields
  createdDate: string;
  updatedDate: string;
  ownerId: string;

  // Additional fields
  tags?: string[];
  notes?: string;
  showingInstructions?: string;
}

// Filter options for property listings
export interface PropertyFilters {
  dealTypes: DealType[];
  markets: Market[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
}

// API response types
export interface PropertyListResponse {
  properties: Property[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PropertyDetailResponse {
  property: Property;
}

// Salesforce API types
export interface SalesforceTransaction {
  Id: string;
  Name: string;
  Description__c?: string;
  Street_Address__c: string;
  City__c: string;
  State__c: string;
  Zip_Code__c: string;
  Parish__c: string;
  Bedrooms__c: number;
  Bathrooms__c: number;
  Square_Feet__c: number;
  Lot_Size__c?: number;
  Year_Built__c?: number;
  Property_Type__c: string;
  Deal_Type__c: DealType;
  Market__c: Market;
  List_Price__c: number;
  Purchase_Price__c?: number;
  Status__c: PropertyStatus;
  Access_Tier__c: AccessTier;
  Is_Off_Market__c: boolean;
  ARV__c?: number;
  Rehab_Estimate__c?: number;
  Spread__c?: number;
  ROI__c?: number;
  Gross_Yield__c?: number;
  Cap_Rate__c?: number;
  Monthly_Rent__c?: number;
  CreatedDate: string;
  LastModifiedDate: string;
  OwnerId: string;
  Tags__c?: string;
  Notes__c?: string;
  Showing_Instructions__c?: string;
}

// Utility type for converting Salesforce fields to our Property interface
export type PropertyFromSalesforce = (transaction: SalesforceTransaction, images: PropertyImage[]) => Property;