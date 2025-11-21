// Shared utility for API URL normalization
// Normalize URL to remove trailing slashes to prevent double slashes in concatenation
export const normalizeUrl = (url: string): string => {
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

// Get normalized API base URL
export const getApiBaseUrl = (): string => {
  return normalizeUrl(
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
      ? 'https://fluenti-backend.onrender.com' 
      : 'http://localhost:3000')
  );
};

// Construct a full API URL from a path
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with / and normalize
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

