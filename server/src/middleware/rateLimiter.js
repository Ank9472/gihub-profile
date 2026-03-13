const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter - applies to all routes
 */
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: 'Check Retry-After header'
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * API rate limiter - for standard API endpoints
 */
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'API rate limit exceeded. Please slow down.',
    retryAfter: 'Check Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Strict rate limiter for AI analysis endpoints
 * These are more expensive in terms of API costs and computation
 */
const analysisRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 analysis requests per minute
  message: {
    success: false,
    message: 'Analysis rate limit exceeded. AI analysis is resource-intensive, please wait before trying again.',
    retryAfter: 'Check Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Auth rate limiter - for login/signup endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 'Check Retry-After header'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful auth attempts
});

/**
 * Create a custom rate limiter with specific settings
 */
const createRateLimiter = (options) => {
  const defaults = {
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
      success: false,
      message: 'Rate limit exceeded.',
      retryAfter: 'Check Retry-After header'
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaults, ...options });
};

module.exports = {
  globalRateLimiter,
  apiRateLimiter,
  analysisRateLimiter,
  authRateLimiter,
  createRateLimiter
};
