// PropertyCard component with Swiper carousel - Cedar Cash Home Buyers

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { MapPin, Bed, Bath, Maximize, Calendar, TrendingUp, Percent } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { Property } from '@/types';
import { Badge, DealTypeBadge, StatusBadge, AccessTierBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  formatSquareFeet,
  formatShortAddress,
  formatPercentage,
  formatRelativeTime,
  generatePropertySlug
} from '@/lib/utils';

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
  const propertySlug = generatePropertySlug(property.title, property.id);

  const renderMetrics = () => {
    if (property.dealType === 'Fix & Flip' && property.flipMetrics) {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>ARV: {formatCurrency(property.flipMetrics.arv)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Percent className="w-4 h-4" />
            <span>ROI: {formatPercentage(property.flipMetrics.roi)}</span>
          </div>
          {showFullDetails && (
            <>
              <div className="text-gray-600">
                Rehab: {formatCurrency(property.flipMetrics.rehabEstimate)}
              </div>
              <div className="text-gray-600">
                Spread: {formatCurrency(property.flipMetrics.spread)}
              </div>
            </>
          )}
        </div>
      );
    }

    if (property.dealType === 'Rental' && property.rentalMetrics) {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Percent className="w-4 h-4" />
            <span>Yield: {formatPercentage(property.rentalMetrics.grossYield)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Cap Rate: {formatPercentage(property.rentalMetrics.capRate)}</span>
          </div>
          {showFullDetails && property.rentalMetrics.monthlyRent && (
            <div className="col-span-2 text-gray-600">
              Monthly Rent: {formatCurrency(property.rentalMetrics.monthlyRent)}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow ${className}`}>
      {/* Image Carousel */}
      <div className="relative h-64">
        {property.images.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={property.images.length > 1}
            className="h-full"
          >
            {property.images.map((image) => (
              <SwiperSlide key={image.id}>
                <Image
                  src={image.url}
                  alt={image.altText || `${property.title} - Property Image`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No images available</span>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-2 left-2 z-10">
          <DealTypeBadge dealType={property.dealType} />
        </div>

        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <StatusBadge status={property.status} />
          <AccessTierBadge tier={property.accessTier} />
        </div>

        {property.isOffMarket && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge className="bg-red-600 text-white">
              Off Market
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </h3>
          <div className="text-right ml-2">
            <p className="text-xl font-bold text-cedar-green">
              {formatCurrency(property.listPrice)}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1 text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {property.accessTier === 'public' ?
              formatShortAddress(property.address) :
              `${property.address.street}, ${formatShortAddress(property.address)}`
            }
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
            <span>{formatSquareFeet(property.squareFeet)}</span>
          </div>
        </div>

        {/* Deal Metrics */}
        {renderMetrics()}

        {/* Description (if showing full details) */}
        {showFullDetails && property.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {property.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Listed {formatRelativeTime(property.createdDate)}</span>
          </div>

          <Link href={`/properties/${propertySlug}`}>
            <Button size="sm" className="text-xs">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}