import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes (login, signup)
 * More strict to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  // Default keyGenerator handles both IPv4 and IPv6 correctly
});

/**
 * Rate limiter for password reset requests
 * Very strict to prevent abuse
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Default keyGenerator handles both IPv4 and IPv6 correctly
});

/**
 * Rate limiter for token refresh
 * Moderate limits to prevent abuse while allowing legitimate use
 */
export const refreshTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 refresh requests per 15 minutes
  message: {
    message: 'Too many token refresh attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Default keyGenerator handles both IPv4 and IPv6 correctly
});

/**
 * General API rate limiter
 * Generous limits for normal API usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Default keyGenerator handles both IPv4 and IPv6 correctly
});
