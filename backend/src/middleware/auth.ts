import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import prisma from "../database/connection";

/**
 * Service-to-service authentication middleware.
 * Validates the X-Service-Secret header matches the configured secret.
 * This ensures only our Vercel frontend (or authorized clients) can call the API.
 */
export function serviceAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceSecret = req.headers["x-service-secret"];

  if (serviceSecret && serviceSecret === config.serviceSecret) {
    return next();
  }

  // Allow browser image requests if session token is provided via cookie or query param
  if (
    req.method === "GET" &&
    req.path.startsWith("/api/photos/") &&
    (req.cookies?.session_token || req.query?.token)
  ) {
    return next();
  }

  res.status(403).json({ error: "Forbidden: invalid service credentials" });
}

/**
 * User session authentication middleware.
 * Validates the session token from the Authorization header or cookie.
 * Attaches the authenticated user to req.user.
 */
export async function sessionAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header or cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies?.session_token) {
      token = req.cookies.session_token;
    } else if (req.query?.token && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Look up the session in the database
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Attach user info to the request object
    (req as any).user = {
      id: session.user.id,
      username: session.user.username,
      displayName: session.user.displayName,
      role: session.user.role,
    };

    (req as any).sessionId = session.id;

    next();
  } catch (error) {
    console.error("[Auth Middleware Error]", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Role-based authorization middleware.
 * Must be used after sessionAuthMiddleware.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
