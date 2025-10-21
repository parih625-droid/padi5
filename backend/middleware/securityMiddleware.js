const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced from 2 hours for development)
  max: 10, // Increased limit to 10 requests per windowMs for auth
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900 // 15 minutes in seconds (reduced from 2 hours)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed requests
});

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 120 * 60 * 1000, // 2 hours (changed from 15 minutes)
  max: 1000, // Increased limit to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 7200 // 2 hours in seconds (changed from 900)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Log rate limiting checks for debugging
    const shouldSkip = req.url.startsWith('/api/orders/payment');
    
    console.log('SECURITY MIDDLEWARE RATE LIMIT CHECK:', {
      url: req.url,
      skip: shouldSkip,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return shouldSkip;
  }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  securityHeaders
};