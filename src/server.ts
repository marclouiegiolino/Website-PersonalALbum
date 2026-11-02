import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { authRateLimiter, apiRateLimiter } from "./middleware/rate-limit";
import { serviceAuthMiddleware } from "./middleware/auth";
import { authRoutes } from "./modules/auth/auth.routes";
import { albumRoutes } from "./modules/albums/album.routes";
import { photoRoutes } from "./modules/photos/photo.routes";
import { ensureStorageDirectories } from "./services/storage";
import { AuthService } from "./modules/auth/auth.service";

const app = express();

// =============================================================================
// Global Middleware
// =============================================================================

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Service-Secret"],
  })
);

// Parse JSON bodies (limit to 1MB for non-upload routes)
app.use(express.json({ limit: "1mb" }));

// Parse cookies
app.use(cookieParser());

// =============================================================================
// Health Check (no auth required)
// =============================================================================

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// =============================================================================
// Service-to-service authentication
// =============================================================================

// All routes below require the service secret header
app.use(serviceAuthMiddleware);

// =============================================================================
// API Routes
// =============================================================================

// Auth routes (with stricter rate limiting)
app.use("/api/auth", authRateLimiter, authRoutes);

// Album routes
app.use("/api/albums", apiRateLimiter, albumRoutes);

// Photo routes
app.use("/api/photos", apiRateLimiter, photoRoutes);

// =============================================================================
// Error handling
// =============================================================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Server Error]", err.message);

    if (config.isDev) {
      console.error(err.stack);
    }

    res.status(500).json({
      error: "Internal server error",
      ...(config.isDev && { message: err.message }),
    });
  }
);

// =============================================================================
// Start Server
// =============================================================================

async function start() {
  try {
    // Ensure storage directories exist
    await ensureStorageDirectories();

    // Clean up expired sessions on startup
    const authService = new AuthService();
    const cleaned = await authService.cleanExpiredSessions();
    if (cleaned > 0) {
      console.log(`[Startup] Cleaned ${cleaned} expired session(s)`);
    }

    app.listen(config.port, () => {
      console.log(`\n🌹 MyMicaela Local Server`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Port:        ${config.port}`);
      console.log(`   Storage:     ${config.storagePath}`);
      console.log(`   CORS Origin: ${config.corsOrigin}`);
      console.log(`   Health:      http://localhost:${config.port}/health\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
