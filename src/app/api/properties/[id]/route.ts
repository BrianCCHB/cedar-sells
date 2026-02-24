// API route for fetching individual property details - Cedar Sells

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { salesforceClient, transformSalesforceTransaction } from '@/lib/salesforce';
import { cloudinaryClient } from '@/lib/cloudinary';
import { AccessTier } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;

    // Determine user's access tier
    let accessTier: AccessTier = 'public';
    if (userId) {
      accessTier = 'registered';

      // Check if user is VIP (implement your VIP logic here)
      const isVip = false; // Implement VIP check logic
      if (isVip) {
        accessTier = 'vip';
      }
    }

    // Fetch property from Salesforce
    const transaction = await salesforceClient.getTransaction(propertyId);

    // Check if user has access to this property
    if (transaction.Access_Tier__c === 'vip' && accessTier !== 'vip') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'This property is only available to VIP members',
        },
        { status: 403 }
      );
    }

    if (transaction.Access_Tier__c === 'registered' && accessTier === 'public') {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration required',
          message: 'Please register to view property details',
        },
        { status: 401 }
      );
    }

    // Fetch images from Cloudinary
    const images = await cloudinaryClient.getPropertyImages(propertyId);

    // Transform Salesforce data to our Property interface
    let property = transformSalesforceTransaction(transaction, images);

    // Apply access tier filtering
    if (accessTier === 'public') {
      property = {
        ...property,
        address: {
          ...property.address,
          street: 'Address available after registration',
        },
        showingInstructions: undefined,
        notes: undefined,
        flipMetrics: property.flipMetrics ? {
          ...property.flipMetrics,
          spread: 0,
        } : undefined,
        rentalMetrics: property.rentalMetrics ? {
          ...property.rentalMetrics,
          monthlyRent: undefined,
        } : undefined,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        property,
      },
    });

  } catch (error) {
    console.error(`Error fetching property:`, error);

    // Handle specific Salesforce errors
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Property not found',
          message: 'The requested property does not exist or has been removed',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch property',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}