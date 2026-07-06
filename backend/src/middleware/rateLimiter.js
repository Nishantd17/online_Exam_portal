import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const rateLimitStore = new Map();

// Periodic cleanup of inactive IPs to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const activeTimestamps = timestamps.filter(timestamp => now - timestamp < 15 * 60 * 1000);
    if (activeTimestamps.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, activeTimestamps);
    }
  }
}, 10 * 60 * 1000).unref();

export const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.'
  } = options;

  return (req, res, next) => {
    // Relax rate limits in development mode to prevent developer lockouts during testing
    if (env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.ip;
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    const timestamps = rateLimitStore.get(ip).filter(timestamp => now - timestamp < windowMs);

    if (timestamps.length >= max) {
      return next(new ApiError(429, message));
    }

    timestamps.push(now);
    rateLimitStore.set(ip, timestamps);
    next();
  };
};
