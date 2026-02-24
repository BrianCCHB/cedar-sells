// PropertyFilters component for Cedar Sells

'use client';

import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DealType, Market, PropertyFilters as IPropertyFilters } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PropertyFiltersProps {
  filters: IPropertyFilters;
  onFiltersChange: (filters: IPropertyFilters) => void;
  className?: string;
}

const DEAL_TYPES: DealType[] = ['Fix & Flip', 'Wholesale', 'Rental'];
const MARKETS: Market[] = ['Lafayette', 'Baton Rouge', 'Other'];

const PRICE_RANGES = [
  { label: 'Any Price', min: undefined, max: undefined },
  { label: 'Under $50K', min: undefined, max: 50000 },
  { label: '$50K - $100K', min: 50000, max: 100000 },
  { label: '$100K - $200K', min: 100000, max: 200000 },
  { label: '$200K - $300K', min: 200000, max: 300000 },
  { label: 'Over $300K', min: 300000, max: undefined },
];

const BEDROOM_OPTIONS = [
  { label: 'Any', value: undefined },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
];

const BATHROOM_OPTIONS = [
  { label: 'Any', value: undefined },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
];

const SQFT_RANGES = [
  { label: 'Any Size', min: undefined, max: undefined },
  { label: 'Under 1,000', min: undefined, max: 1000 },
  { label: '1,000 - 1,500', min: 1000, max: 1500 },
  { label: '1,500 - 2,000', min: 1500, max: 2000 },
  { label: '2,000 - 3,000', min: 2000, max: 3000 },
  { label: 'Over 3,000', min: 3000, max: undefined },
];

export function PropertyFilters({
  filters,
  onFiltersChange,
  className = ""
}: PropertyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (updates: Partial<IPropertyFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleDealType = (dealType: DealType) => {
    const currentTypes = filters.dealTypes || [];
    const newTypes = currentTypes.includes(dealType)
      ? currentTypes.filter(t => t !== dealType)
      : [...currentTypes, dealType];

    updateFilters({ dealTypes: newTypes });
  };

  const toggleMarket = (market: Market) => {
    const currentMarkets = filters.markets || [];
    const newMarkets = currentMarkets.includes(market)
      ? currentMarkets.filter(m => m !== market)
      : [...currentMarkets, market];

    updateFilters({ markets: newMarkets });
  };

  const setPriceRange = (min?: number, max?: number) => {
    updateFilters({ minPrice: min, maxPrice: max });
  };

  const setBedrooms = (minBedrooms?: number) => {
    updateFilters({ minBedrooms });
  };

  const setBathrooms = (minBathrooms?: number) => {
    updateFilters({ minBathrooms });
  };

  const setSqftRange = (min?: number, max?: number) => {
    updateFilters({ minSquareFeet: min, maxSquareFeet: max });
  };

  const clearFilters = () => {
    onFiltersChange({
      dealTypes: [],
      markets: [],
      minPrice: undefined,
      maxPrice: undefined,
      minBedrooms: undefined,
      minBathrooms: undefined,
      minSquareFeet: undefined,
      maxSquareFeet: undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dealTypes?.length) count++;
    if (filters.markets?.length) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minBedrooms) count++;
    if (filters.minBathrooms) count++;
    if (filters.minSquareFeet || filters.maxSquareFeet) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-cedar-green" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cedar-green"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Always Visible Filters */}
      <div className="space-y-4">
        {/* Deal Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Type
          </label>
          <div className="flex flex-wrap gap-2">
            {DEAL_TYPES.map((dealType) => (
              <Button
                key={dealType}
                variant={filters.dealTypes?.includes(dealType) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDealType(dealType)}
                className="text-xs"
              >
                {dealType}
              </Button>
            ))}
          </div>
        </div>

        {/* Markets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Market
          </label>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((market) => (
              <Button
                key={market}
                variant={filters.markets?.includes(market) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMarket(market)}
                className="text-xs"
              >
                {market}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range, index) => {
                const isActive = filters.minPrice === range.min && filters.maxPrice === range.max;
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriceRange(range.min, range.max)}
                    className="text-xs justify-start"
                  >
                    {range.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <div className="flex gap-2">
              {BEDROOM_OPTIONS.map((option, index) => {
                const isActive = filters.minBedrooms === option.value;
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBedrooms(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <div className="flex gap-2">
              {BATHROOM_OPTIONS.map((option, index) => {
                const isActive = filters.minBathrooms === option.value;
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBathrooms(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Square Footage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Square Footage
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SQFT_RANGES.map((range, index) => {
                const isActive = filters.minSquareFeet === range.min && filters.maxSquareFeet === range.max;
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSqftRange(range.min, range.max)}
                    className="text-xs justify-start"
                  >
                    {range.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}