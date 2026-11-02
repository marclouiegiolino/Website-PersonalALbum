import rateLimit from "express-rate-limit";
import { config } from "../config";

/**
 * Stricter rate limiter for authentication endpoints.
 * Prevents brute-force login attempts.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMinutes * 60 * 1000,
  max: config.authRateLimit.maxRequests,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind Cloudflare Tunnel, otherwise use IP
    return (
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      req.ip ||
      "unknown"
    );
  },
});

/**
 * General rate limiter for API endpoints.
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.apiRateLimit.windowMinutes * 60 * 1000,
  max: config.apiRateLimit.maxRequests,
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      req.ip ||
      "unknown"
    );
  },
});
