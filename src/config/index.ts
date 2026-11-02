import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(optionalEnv("PORT", "4000"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  isDev: optionalEnv("NODE_ENV", "development") === "development",

  // Service-to-service auth
  serviceSecret: requireEnv("SERVICE_SECRET"),

  // Session
  sessionExpiryHours: parseInt(optionalEnv("SESSION_EXPIRY_HOURS", "24"), 10),

  // Storage
  storagePath: path.resolve(
    __dirname,
    "../../",
    optionalEnv("STORAGE_PATH", "./storage/private")
  ),
  originalsDir: "originals",
  thumbnailsDir: "thumbnails",

  // Upload limits
  maxFileSizeMB: parseInt(optionalEnv("MAX_FILE_SIZE_MB", "20"), 10),
  get maxFileSizeBytes() {
    return this.maxFileSizeMB * 1024 * 1024;
  },
  allowedMimeTypes: optionalEnv(
    "ALLOWED_MIME_TYPES",
    "image/jpeg,image/png,image/webp,image/gif"
  ).split(","),

  // Rate limiting
  authRateLimit: {
    windowMinutes: parseInt(
      optionalEnv("AUTH_RATE_LIMIT_WINDOW_MINUTES", "15"),
      10
    ),
    maxRequests: parseInt(
      optionalEnv("AUTH_RATE_LIMIT_MAX_REQUESTS", "100"),
      10
    ),
  },
  apiRateLimit: {
    windowMinutes: parseInt(
      optionalEnv("API_RATE_LIMIT_WINDOW_MINUTES", "15"),
      10
    ),
    maxRequests: parseInt(
      optionalEnv("API_RATE_LIMIT_MAX_REQUESTS", "1000"),
      10
    ),
  },

  // CORS
  corsOrigin: optionalEnv("CORS_ORIGIN", "http://localhost:3000"),

  // Thumbnails
  thumbnail: {
    width: parseInt(optionalEnv("THUMBNAIL_WIDTH", "400"), 10),
    height: parseInt(optionalEnv("THUMBNAIL_HEIGHT", "400"), 10),
    quality: parseInt(optionalEnv("THUMBNAIL_QUALITY", "80"), 10),
  },
} as const;
