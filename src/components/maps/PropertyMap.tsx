/**
 * PropertyMap Component
 *
 * Interactive Google Maps component with Street View integration for property detail pages.
 * Provides full map functionality including Street View toggle and directions.
 *
 * Features:
 * - Interactive Google Maps with property markers
 * - Street View panorama toggle
 * - Map/Street View switching controls
 * - "Open in Google Maps" directions button
 * - Automatic geocoding and positioning
 * - Error handling and fallback UI
 * - Mobile-responsive design
 *
 * @param address - Property street address
 * @param city - Property city (defaults to Lafayette)
 * @param state - Property state (defaults to LA)
 * @param zipCode - Property ZIP code
 * @param className - Additional CSS classes
 * @param showStreetView - Enable Street View functionality
 * @param height - Container height (defaults to 300px)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
// Use dynamic import instead of Loader class
import { MapPin, Eye, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface PropertyMapProps {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  className?: string;
  showStreetView?: boolean;
  height?: string;
}

export function PropertyMap({
  address,
  city = 'Lafayette',
  state = 'LA',
  zipCode,
  className = '',
  showStreetView = true,
  height = '300px'
}: PropertyMapProps) {
  // Wrap everything in a try-catch to prevent crashes
  try {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [streetView, setStreetView] = useState<google.maps.StreetViewPanorama | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStreetViewMode, setShowStreetViewMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Google Maps API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Format address for geocoding
  const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}${zipCode ? ` ${zipCode}` : ''}`;

  // Check if we have a valid address for mapping
  const hasValidAddress = address &&
    address !== 'Address Available Upon Contact' &&
    address !== 'Address available upon contact' &&
    address.trim().length > 5;

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    if (!hasValidAddress || !mapRef.current) {
      setError(!hasValidAddress ? 'Address not available' : 'Map container not ready');
      setIsLoading(false);
      return;
    }

    // Load Google Maps using script tag approach
    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          resolve(window.google);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps().then(async () => {
      try {
        console.log('Google Maps loaded, initializing geocoder for:', fullAddress);
        // Initialize geocoder
        const geocoder = new google.maps.Geocoder();

        // Geocode the address
        const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Could not find location for: ${address}`));
            }
          });
        });

        const location = results[0].geometry.location;

        // Create map
        const mapInstance = new google.maps.Map(mapRef.current!, {
          center: location,
          zoom: 17,
          mapTypeId: 'hybrid',
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Add marker
        new google.maps.Marker({
          position: location,
          map: mapInstance,
          title: address,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        setMap(mapInstance);

        // Initialize Street View if enabled
        if (showStreetView && streetViewRef.current) {
          const streetViewInstance = new google.maps.StreetViewPanorama(
            streetViewRef.current,
            {
              position: location,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              fullscreenControl: false,
              enableCloseButton: false
            }
          );

          setStreetView(streetViewInstance);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to load map for this address');
        setIsLoading(false);
      }
    });
  }, [address, apiKey, fullAddress, showStreetView]);

  if (!apiKey) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Maps API key required</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map View */}
      <div
        ref={mapRef}
        className={`w-full h-full ${showStreetViewMode ? 'hidden' : ''}`}
        style={{ height }}
      />

      {/* Street View */}
      {showStreetView && (
        <div
          ref={streetViewRef}
          className={`w-full h-full ${!showStreetViewMode ? 'hidden' : ''}`}
          style={{ height }}
        />
      )}

      {/* Controls */}
      {showStreetView && !isLoading && (
        <div className="absolute top-2 right-2 z-20">
          <Button
            size="sm"
            variant={showStreetViewMode ? "default" : "outline"}
            className="bg-white/90 hover:bg-white text-black border-gray-200 shadow-sm"
            onClick={() => setShowStreetViewMode(!showStreetViewMode)}
          >
            {showStreetViewMode ? (
              <>
                <MapPin className="w-3 h-3 mr-1" />
                Map
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Street
              </>
            )}
          </Button>
        </div>
      )}

      {/* Open in Google Maps */}
      {!isLoading && (
        <div className="absolute bottom-2 right-2 z-20">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 hover:bg-white text-black border-gray-200 shadow-sm"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
              window.open(mapsUrl, '_blank');
            }}
          >
            <Navigation className="w-3 h-3 mr-1" />
            Directions
          </Button>
        </div>
      )}
    </div>
  );
  } catch (componentError) {
    console.error('PropertyMap component error:', componentError);
    // Return fallback UI
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Map temporarily unavailable</p>
        </div>
      </div>
    );
  }
}