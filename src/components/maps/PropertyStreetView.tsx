/**
 * PropertyStreetView Component
 *
 * Displays static Google Street View images as property photos using the Street View Static API.
 * This provides a clean, fast-loading alternative to interactive maps for property cards.
 *
 * Features:
 * - Static Street View images (600x192px)
 * - Automatic address geocoding via Google
 * - Error handling with fallback UI
 * - Loading states with spinner
 * - Mobile-friendly responsive design
 *
 * @param address - Property street address
 * @param city - Property city (defaults to Lafayette)
 * @param state - Property state (defaults to LA)
 * @param zipCode - Property ZIP code
 * @param className - Additional CSS classes
 * @param height - Container height (defaults to 192px)
 */

'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface PropertyStreetViewProps {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  className?: string;
  height?: string;
}

export function PropertyStreetView({
  address,
  city = 'Lafayette',
  state = 'LA',
  zipCode,
  className = '',
  height = '192px'
}: PropertyStreetViewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get Google Maps API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Format address for the Street View Static API
  const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${zipCode ? ` ${zipCode}` : ''}`;

  // Check if we have a valid address
  const hasValidAddress = address &&
    address !== 'Address Available Upon Contact' &&
    address !== 'Address available upon contact' &&
    address.trim().length > 5;

  if (!apiKey || !hasValidAddress) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {!apiKey ? 'Maps API key required' : 'Address not available'}
          </p>
        </div>
      </div>
    );
  }

  // Simplified Google Street View Static API URL - let Google choose the best view
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?` +
    `location=${encodeURIComponent(fullAddress)}` +
    `&size=600x192` +
    `&pitch=0` +
    `&fov=90` +
    `&key=${apiKey}`;

  if (imageError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Street View not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-600">Loading Street View...</p>
          </div>
        </div>
      )}

      <img
        src={streetViewUrl}
        alt={`Street View of ${address}`}
        className="w-full h-full object-cover block absolute inset-0"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}