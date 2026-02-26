// Main listings page with filtering and access tiers - Cedar Sells

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Grid, List, Loader2, AlertCircle, UserPlus } from 'lucide-react';

import { Property, PropertyFilters as IPropertyFilters } from '@/types';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyFilters } from '@/components/property/PropertyFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ListingsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ListingsPage({ searchParams }: ListingsPageProps) {
  const { user, isLoaded } = useUser();

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

  // Determine user access tier - no public access
  const getUserAccessTier = () => {
    if (!user) return null; // Require login

    // Check if user is VIP (implement your VIP logic here)
    const isVip = user.publicMetadata?.isVip || false;
    return isVip ? 'vip' : 'registered';
  };

  const accessTier = getUserAccessTier();

  // Fetch properties
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

  // Initial load - require login
  useEffect(() => {
    if (isLoaded && accessTier) {
      fetchProperties(filters);
    }
  }, [isLoaded, accessTier]);

  // Login required notice
  const renderLoginRequired = () => {
    if (accessTier !== null) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              Members Only Access
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view our exclusive investment property listings.
            </p>
            <div className="flex gap-3">
              <Link href="/sign-in" className="flex-1">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href="/sign-up" className="flex-1">
                <Button variant="outline" className="w-full">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show login screen if not authenticated
  if (!accessTier) {
    return renderLoginRequired();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center gap-6">
              <Link href="/">
                <Image
                  src={process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png'}
                  alt="Cedar Sells"
                  width={200}
                  height={50}
                  className="h-8 w-auto"
                />
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/listings" className="text-cedar-green font-medium">
                  Properties
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-cedar-green">
                  About
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-cedar-green">
                  Contact
                </Link>
              </nav>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:inline-flex">
                Access: {accessTier === 'registered' ? 'Member' : 'VIP'}
              </Badge>

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    Welcome, {user.firstName || user.emailAddresses[0].emailAddress}
                  </span>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/sign-in">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Page Title */}
          <div className="mt-6">
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Investment Properties
            </h1>
            <p className="text-gray-600 mt-2">
              Discover profitable real estate opportunities in Lafayette, Baton Rouge, and surrounding Acadiana parishes
            </p>
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
                <Loader2 className="w-8 h-8 animate-spin text-cedar-green" />
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
      <footer className="bg-cedar-dark-green text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Image
                src={process.env.NEXT_PUBLIC_LOGO_WHITE_URL || '/logo-white.png'}
                alt="Cedar Sells"
                width={200}
                height={50}
                className="h-8 w-auto mb-2"
              />
              <p className="text-sm text-gray-300">
                Professional real estate investment opportunities in Louisiana
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {process.env.NEXT_PUBLIC_COMPANY_PHONE}
              </p>
              <p className="text-sm text-gray-300">
                {process.env.NEXT_PUBLIC_COMPANY_WEBSITE}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}