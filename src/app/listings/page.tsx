// Simplified listings page without authentication - Cedar Sells

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Grid, List, Loader2, AlertCircle } from 'lucide-react';

import { PropertyFilters as IPropertyFilters } from '@/types';
import { Property } from '@/lib/database';
import { PropertyCard } from '@/components/property/PropertyCard.new';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { Button } from '@/components/ui/button';

interface ListingsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<IPropertyFilters>({
    dealTypes: [],
    markets: [],
    minPrice: undefined,
    maxPrice: undefined,
    minBedrooms: undefined,
    minBathrooms: undefined,
    minSquareFeet: undefined,
    maxSquareFeet: undefined,
  });

  // Fetch properties (simplified - no auth required for now)
  const fetchProperties = async (currentFilters: IPropertyFilters, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (currentFilters.dealTypes?.length) {
        params.append('dealTypes', currentFilters.dealTypes.join(','));
      }

      if (currentFilters.markets?.length) {
        params.append('markets', currentFilters.markets.join(','));
      }

      params.append('limit', '20');
      params.append('offset', offset.toString());

      const response = await fetch(`/api/properties-db?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();

      if (data.success) {
        if (offset === 0) {
          setProperties(data.data.properties);
        } else {
          setProperties(prev => [...prev, ...data.data.properties]);
        }
        setTotalCount(data.data.totalCount);
        setHasMore(data.data.hasMore);
      } else {
        throw new Error(data.message || 'Failed to fetch properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Load more properties
  const loadMore = () => {
    fetchProperties(filters, properties.length);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: IPropertyFilters) => {
    setFilters(newFilters);
    fetchProperties(newFilters, 0);
  };

  // Initial load
  useEffect(() => {
    fetchProperties(filters);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-6">
              <Link href="/">
                <div className="text-xl font-bold text-green-800">Cedar Sells</div>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/listings" className="text-green-800 font-medium">
                  Properties
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-green-800">
                  About
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-green-800">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Auth Button */}
            <div className="flex items-center gap-4">
              {/* Database-backed properties - no Salesforce connection needed */}
            </div>
          </div>

          {/* Page Title */}
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Investment Properties
            </h1>
            <p className="text-gray-600 mt-2">
              Discover profitable real estate opportunities in Lafayette, Baton Rouge, and surrounding areas
            </p>

            {/* Success Stats for Social Proof */}
            {properties.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {properties.filter(p => p.status === 'Sold').length}
                  </div>
                  <div className="text-sm text-green-700">Properties Sold</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {properties.filter(p => p.status !== 'Sold').length}
                  </div>
                  <div className="text-sm text-blue-700">Available Now</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {properties.filter(p => p.actualProfit && p.actualProfit > 0).length}
                  </div>
                  <div className="text-sm text-orange-700">Profitable Deals</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${Math.round(
                      properties
                        .filter(p => p.actualProfit && p.actualProfit > 0)
                        .reduce((sum, p) => sum + (p.actualProfit || 0), 0) / 1000
                    )}K
                  </div>
                  <div className="text-sm text-purple-700">Total Profit</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <PropertyFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              className="sticky top-6"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${totalCount} properties found`}
                </p>

                {/* View Mode Toggle */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Properties Grid/List */}
            {loading && properties.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : properties.length > 0 ? (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      showFullDetails={viewMode === 'list'}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Properties'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters to see more results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-green-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold mb-2">Cedar Sells</div>
              <p className="text-sm text-gray-300">
                Professional real estate investment opportunities in Louisiana
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">(337) 420-0375</p>
              <p className="text-sm text-gray-300">
                cedarcashhomebuyers.com
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}