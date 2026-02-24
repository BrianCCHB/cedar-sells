// User and authentication types for Cedar Sells

import { AccessTier } from './property';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  accessTier: AccessTier;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;

  // Additional profile fields
  company?: string;
  investorType?: string; // 'First Time', 'Experienced', 'Professional', etc.
  interests?: string[]; // Areas of interest

  // Salesforce Lead ID (created via webhook)
  salesforceLeadId?: string;
}

// Clerk user extended with our custom fields
export interface ClerkUserMetadata {
  accessTier: AccessTier;
  isVip: boolean;
  salesforceLeadId?: string;
  company?: string;
  investorType?: string;
  interests?: string[];
}

// Registration form data
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  investorType?: string;
  interests?: string[];
}

// Salesforce Lead creation payload
export interface SalesforceLeadPayload {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Company?: string;
  LeadSource: string;
  Status: string;
  Investor_Type__c?: string;
  Interests__c?: string;
  Website_User_ID__c: string; // Clerk user ID
}

export interface SalesforceLeadResponse {
  id: string;
  success: boolean;
  errors?: string[];
}