/**
 * Utility to construct proper image URLs for Next.js Image component
 */

import { getApiUrl } from './api-url';

/**
 * Convert a relative or absolute image URL to a full URL
 * @param imageUrl - Image URL from the database (could be relative or absolute)
 * @returns Full image URL or null if no image
 */
export const getImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) {
    return null;
  }

  // If it's already a full URL, return as is (trust the backend)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative URL, prepend the API base URL (without /api)
  const apiUrl = getApiUrl().replace('/api', '');

  // Handle bare filenames (e.g., "file-123456789-123456789.jpeg")
  // These are uploaded files that should be in the /uploads/ directory
  if (!imageUrl.startsWith('/') && imageUrl.match(/^file-\d+-\d+\.(jpeg|jpg|png|gif|webp)$/i)) {
    return `${apiUrl}/uploads/${imageUrl}`;
  }

  // Ensure the path starts with a slash
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${apiUrl}${path}`;
};
