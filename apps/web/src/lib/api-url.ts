/**
 * Utility to construct proper API URLs for both server-side and client-side contexts
 */

/**
 * Get the base API URL with proper formatting
 * Works in both server-side (uses API_URL) and client-side (uses NEXT_PUBLIC_API_URL) contexts
 */
export const getApiUrl = (): string => {
  // Server-side: use API_URL, fallback to NEXT_PUBLIC_API_URL, then localhost
  // Client-side: use NEXT_PUBLIC_API_URL, then localhost
  const apiUrl =
    (typeof window === 'undefined' ? process.env.API_URL : undefined) ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';

  let baseUrl = apiUrl.trim();

  // If this is only a service name (without dots), add .onrender.com
  if (!baseUrl.includes('.') && !baseUrl.startsWith('http') && !baseUrl.includes('localhost')) {
    baseUrl = `${baseUrl}.onrender.com`;
  }

  // If URL doesn't start with http, add https://
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }

  // If URL doesn't end with /api, add it
  if (!baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/api`;
  }

  return baseUrl;
};

/**
 * Construct a full API endpoint URL
 * @param path - API path (e.g., '/articles', '/categories')
 * @param params - Optional query parameters
 */
export const getApiEndpoint = (path: string, params?: Record<string, any>): string => {
  const baseUrl = getApiUrl();

  // Remove leading slash from path if present (baseUrl already ends with /api)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  let url = `${baseUrl}${cleanPath}`;

  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
};
