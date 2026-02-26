// PropertyCard for transaction-based properties with sold/urgency display - Cedar Sells

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Bed, Bath, Maximize, Calendar, DollarSign, TrendingUp, Clock, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/database';
import { PropertyMap } from '@/components/maps/PropertyMap';
import { PropertyStreetView } from '@/components/maps/PropertyStreetView';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface PropertyCardProps {
  property: Property;
  showFullDetails?: boolean;
  className?: string;
}

export function PropertyCard({
  property,
  showFullDetails = false,
  className = ""
}: PropertyCardProps) {
  // State for showing map
  const [showMap, setShowMap] = useState(false);

  // Check if property is sold
  const isSold = property.status === 'Sold' || property.salesDate;

  // Check if we have a valid address for mapping
  const hasValidAddress = property.address &&
    property.address !== 'Address Available Upon Contact' &&
    property.address !== 'Address available upon contact' &&
    property.address.trim().length > 5;

  // Calculate days since sale (for sold properties)
  const daysSinceSale = property.salesDate ?
    Math.floor((Date.now() - new Date(property.salesDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Format sale date for display
  const formatSaleDate = (salesDate: string | null | undefined) => {
    if (!salesDate) return null;
    const date = new Date(salesDate);
    const days = daysSinceSale;

    if (days === 0) return 'Sold today';
    if (days === 1) return 'Sold yesterday';
    if (days < 7) return `Sold ${days} days ago`;
    if (days < 30) return `Sold ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return `Sold ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get profit info for sold properties
  const getProfitInfo = () => {
    if (!isSold) return null;

    const actualProfit = property.actualProfit || 0;
    const projectedProfit = property.projectedProfit || 0;
    const profit = actualProfit || projectedProfit;

    if (profit <= 0) return null;

    return {
      amount: profit,
      type: actualProfit > 0 ? 'actual' : 'projected',
      isActual: actualProfit > 0
    };
  };

  const profitInfo = getProfitInfo();

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all ${isSold ? 'opacity-90' : ''} ${className}`}>
      {/* Property Image - Street View */}
      <div className="relative h-48">
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {isSold ? (
            <Badge className="bg-red-600 text-white font-semibold px-3 py-1">
              SOLD
            </Badge>
          ) : (
            <Badge className="bg-green-600 text-white font-semibold px-3 py-1">
              AVAILABLE
            </Badge>
          )}
        </div>

        {/* Tier Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="outline" className="bg-white/90 text-xs">
            {property.tier?.toUpperCase() || 'PUBLIC'}
          </Badge>
        </div>

        {/* Sold Date (for sold properties) */}
        {isSold && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="bg-black/70 text-white text-xs">
              {formatSaleDate(property.salesDate)}
            </Badge>
          </div>
        )}

        {/* Profit Badge (for sold properties) */}
        {profitInfo && (
          <div className="absolute bottom-3 right-3 z-10">
            <Badge className="bg-yellow-500 text-black font-semibold text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{formatCurrency(profitInfo.amount)} {profitInfo.isActual ? 'profit' : 'projected'}
            </Badge>
          </div>
        )}

        {/* Street View or Placeholder */}
        {hasValidAddress ? (
          <ErrorBoundary
            fallback={
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="text-xs">Investment Property</div>
                </div>
              </div>
            }
          >
            <PropertyStreetView
              address={property.address || ''}
              city={property.city}
              state={property.state}
              zipCode={property.zipCode}
              height="192px"
              className="rounded-none"
            />
          </ErrorBoundary>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">🏠</div>
              <div className="text-xs">Investment Property</div>
            </div>
          </div>
        )}
      </div>

      {/* Map View (when toggled) */}
      {showMap && (
        <div className="border-t border-gray-200">
          <ErrorBoundary
            fallback={
              <div className="bg-gray-100 rounded-lg p-4 text-center" style={{ height: '250px' }}>
                <div className="flex items-center justify-center h-full">
                  <div>
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Map temporarily unavailable</p>
                  </div>
                </div>
              </div>
            }
          >
            <PropertyMap
              address={property.address || ''}
              city={property.city}
              state={property.state}
              zipCode={property.zipCode}
              height="250px"
              showStreetView={true}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1 pr-2">
            Investment Property
          </h3>
          <div className="text-right">
            <p className={`text-xl font-bold ${isSold ? 'text-gray-600' : 'text-green-600'}`}>
              {formatCurrency(property.price)}
            </p>
            {isSold && (
              <p className="text-xs text-gray-500">Sale Price</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1 text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">
            {property.address || 'Address available upon contact'}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" />
            <span>{property.squareFootage?.toLocaleString()} sq ft</span>
          </div>
        </div>

        {/* Investment Path */}
        {property.investmentPath && (
          <div className="flex gap-2 mb-3 text-xs">
            <Badge variant="outline" className="text-xs">
              {property.investmentPath}
            </Badge>
          </div>
        )}

        {/* Description (shortened) */}
        {property.description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Urgency Message for Available Properties */}
        {!isSold && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
            <div className="flex items-center gap-2 text-orange-800 text-xs">
              <Clock className="w-3 h-3" />
              <span className="font-medium">Properties go fast - contact us today!</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              {isSold ? `Sold ${formatSaleDate(property.salesDate)}` :
               `Listed ${new Date(property.createdAt).toLocaleDateString()}`}
            </span>
          </div>

          <div className="flex gap-2">
            {hasValidAddress && (
              <Button
                size="sm"
                variant={showMap ? "default" : "outline"}
                className="text-xs"
                onClick={() => setShowMap(!showMap)}
              >
                <Map className="w-3 h-3 mr-1" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            )}
            {!isSold && (
              <Button size="sm" className="text-xs">
                Contact Now
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-xs">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}