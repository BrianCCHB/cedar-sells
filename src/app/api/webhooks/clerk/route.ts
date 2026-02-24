// Clerk webhook handler for creating Salesforce Leads - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { salesforceClient } from '@/lib/salesforce';
import { SalesforceLeadPayload } from '@/types';

// Webhook payload types from Clerk
interface ClerkUser {
  id: string;
  email_addresses: Array<{
    email_address: string;
    primary: boolean;
  }>;
  first_name?: string;
  last_name?: string;
  phone_numbers?: Array<{
    phone_number: string;
    primary: boolean;
  }>;
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
  created_at: number;
  updated_at: number;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUser;
  object: string;
  timestamp: number;
}

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Check if webhook secret is configured
    if (!WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get headers for webhook verification
    const headerPayload = req.headers;
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    // Check if headers are present
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.text();

    // Create Svix webhook instance
    const webhook = new Webhook(WEBHOOK_SECRET!);

    let evt: ClerkWebhookEvent;

    try {
      // Verify webhook signature
      evt = webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Handle user creation event
    if (evt.type === 'user.created') {
      const user = evt.data;

      // Get primary email
      const primaryEmail = user.email_addresses?.find(email => email.primary)?.email_address;

      if (!primaryEmail) {
        console.error('No primary email found for user:', user.id);
        return NextResponse.json(
          { error: 'No primary email found' },
          { status: 400 }
        );
      }

      // Get primary phone (if available)
      const primaryPhone = user.phone_numbers?.find(phone => phone.primary)?.phone_number;

      // Prepare Salesforce Lead data
      const leadData: SalesforceLeadPayload = {
        FirstName: user.first_name || 'Unknown',
        LastName: user.last_name || 'Investor',
        Email: primaryEmail,
        Phone: primaryPhone,
        Company: user.public_metadata?.company as string || undefined,
        LeadSource: 'Website Registration',
        Status: 'New',
        Investor_Type__c: user.public_metadata?.investorType as string || undefined,
        Interests__c: Array.isArray(user.public_metadata?.interests)
          ? (user.public_metadata.interests as string[]).join(';')
          : undefined,
        Website_User_ID__c: user.id,
      };

      try {
        // Create Lead in Salesforce
        const salesforceResponse = await salesforceClient.createLead(leadData);

        if (salesforceResponse.success) {
          console.log(`Successfully created Salesforce Lead ${salesforceResponse.id} for user ${user.id}`);

          // Optionally, update Clerk user metadata with Salesforce Lead ID
          // This would require the Clerk Backend API

          return NextResponse.json({
            success: true,
            message: 'Lead created successfully',
            salesforceLeadId: salesforceResponse.id,
          });
        } else {
          console.error('Salesforce Lead creation failed:', salesforceResponse.errors);
          return NextResponse.json(
            {
              error: 'Failed to create Salesforce Lead',
              details: salesforceResponse.errors,
            },
            { status: 500 }
          );
        }
      } catch (salesforceError) {
        console.error('Error creating Salesforce Lead:', salesforceError);
        return NextResponse.json(
          {
            error: 'Failed to create Salesforce Lead',
            message: salesforceError instanceof Error ? salesforceError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Handle user update event (optional)
    if (evt.type === 'user.updated') {
      const user = evt.data;

      // You could implement Lead updates here if needed
      console.log(`User ${user.id} updated - could update corresponding Salesforce Lead`);

      return NextResponse.json({
        success: true,
        message: 'User update processed',
      });
    }

    // For other event types, just acknowledge
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}