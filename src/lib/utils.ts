// Utility functions for Cedar Cash Home Buyers

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency values
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage values
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Format square footage
export function formatSquareFeet(sqft: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(sqft) + ' sq ft';
}

// Format addresses
export function formatAddress(address: {
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
  parish?: string;
}): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);

  return parts.join(', ');
}

// Format short address (city, state)
export function formatShortAddress(address: {
  city: string;
  state: string;
  parish?: string;
}): string {
  return `${address.city}, ${address.state}`;
}

// Parse phone numbers
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

// Generate property slug for SEO-friendly URLs
export function generatePropertySlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${slug}-${id}`;
}

// Extract property ID from slug
export function extractPropertyId(slug: string): string {
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

// Calculate days on market
export function daysSinceDate(dateString: string): number {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Format relative time (e.g., "2 days ago", "1 week ago")
export function formatRelativeTime(dateString: string): string {
  const days = daysSinceDate(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';

  return `${Math.floor(days / 30)} months ago`;
}

// Calculate ROI based on deal metrics
export function calculateROI(
  arv: number,
  purchasePrice: number,
  rehabCost: number
): number {
  const totalInvestment = purchasePrice + rehabCost;
  const profit = arv - totalInvestment;
  return totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
}

// Calculate gross yield for rental properties
export function calculateGrossYield(
  monthlyRent: number,
  propertyValue: number
): number {
  const annualRent = monthlyRent * 12;
  return propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Validate email addresses
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone numbers
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
}

// Sleep utility for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}