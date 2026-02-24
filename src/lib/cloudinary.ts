// Cloudinary utilities for image management - Cedar Sells

import { PropertyImage, CloudinaryUploadResponse } from '@/types';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

class CloudinaryClient {
  private config: CloudinaryConfig;

  constructor() {
    this.config = {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    };

    if (!this.config.cloudName || !this.config.apiKey || !this.config.apiSecret) {
      console.warn('Cloudinary credentials not fully configured');
    }
  }

  // Generate Cloudinary URL with transformations
  generateImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'scale' | 'crop';
      quality?: 'auto' | number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      gravity?: 'center' | 'face' | 'auto';
    } = {}
  ): string {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      gravity = 'center'
    } = options;

    let transformations = [`q_${quality}`, `f_${format}`];

    if (width || height) {
      const dimensions = [width && `w_${width}`, height && `h_${height}`]
        .filter(Boolean)
        .join(',');
      transformations.push(`c_${crop}`);
      transformations.push(dimensions);
      if (crop === 'fill') {
        transformations.push(`g_${gravity}`);
      }
    }

    const transformStr = transformations.join(',');

    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${transformStr}/${publicId}`;
  }

  // Generate responsive image URLs for different screen sizes
  generateResponsiveUrls(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  } {
    return {
      thumbnail: this.generateImageUrl(publicId, { width: 150, height: 100, crop: 'fill' }),
      small: this.generateImageUrl(publicId, { width: 300, height: 200, crop: 'fill' }),
      medium: this.generateImageUrl(publicId, { width: 600, height: 400, crop: 'fill' }),
      large: this.generateImageUrl(publicId, { width: 900, height: 600, crop: 'fill' }),
      xlarge: this.generateImageUrl(publicId, { width: 1200, height: 800, crop: 'fill' }),
    };
  }

  // Get property images from Cloudinary based on property ID
  async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    try {
      // In a real implementation, you might query Cloudinary API
      // For now, we'll use a naming convention where property images are tagged
      const response = await fetch(
        `https://res.cloudinary.com/${this.config.cloudName}/image/list/${propertyId}.json`
      );

      if (!response.ok) {
        console.warn(`No images found for property ${propertyId}`);
        return [];
      }

      const data = await response.json();

      return data.resources?.map((resource: any, index: number) => ({
        id: resource.public_id,
        url: this.generateImageUrl(resource.public_id, { width: 800, height: 600 }),
        altText: `Property ${propertyId} - Image ${index + 1}`,
        order: index + 1,
      })) || [];

    } catch (error) {
      console.error(`Error fetching images for property ${propertyId}:`, error);
      return [];
    }
  }

  // Upload image to Cloudinary (for future use)
  async uploadImage(
    file: File,
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
    } = {}
  ): Promise<CloudinaryUploadResponse> {
    const { folder, publicId, tags = [] } = options;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'cedar_properties'); // You'll need to create this in Cloudinary

    if (folder) formData.append('folder', folder);
    if (publicId) formData.append('public_id', publicId);
    if (tags.length > 0) formData.append('tags', tags.join(','));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    return response.json();
  }

  // Generate signed URL for secure uploads (server-side only)
  generateSignedUploadUrl(params: {
    timestamp: number;
    folder?: string;
    publicId?: string;
    tags?: string;
  }): { signature: string; timestamp: number; apiKey: string } {
    // This would be implemented server-side with proper signature generation
    // For now, return basic structure
    return {
      signature: '', // Generated with crypto and secret
      timestamp: params.timestamp,
      apiKey: this.config.apiKey,
    };
  }

  // Helper method to extract public ID from Cloudinary URL
  extractPublicId(cloudinaryUrl: string): string | null {
    const match = cloudinaryUrl.match(/\/v\d+\/(.+?)(?:\.[a-z]+)?$/);
    return match ? match[1] : null;
  }

  // Generate property image folder path
  getPropertyImageFolder(propertyId: string): string {
    return `cedar-properties/${propertyId}`;
  }
}

// Singleton instance
export const cloudinaryClient = new CloudinaryClient();

// Utility functions for common image operations
export const getPropertyThumbnail = (publicId: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizes = {
    sm: { width: 150, height: 100 },
    md: { width: 300, height: 200 },
    lg: { width: 400, height: 300 },
  };

  return cloudinaryClient.generateImageUrl(publicId, {
    ...sizes[size],
    crop: 'fill',
    quality: 'auto',
    format: 'webp',
  });
};

export const getOptimizedImageUrl = (
  publicId: string,
  width?: number,
  height?: number,
  options?: any
) => {
  return cloudinaryClient.generateImageUrl(publicId, {
    width,
    height,
    quality: 'auto',
    format: 'webp',
    crop: 'fill',
    gravity: 'center',
    ...options,
  });
};

// Export the client class
export { CloudinaryClient };