import { Router } from "express";
import { AuthController } from "./auth.controller";
import { sessionAuthMiddleware } from "../../middleware/auth";

const router = Router();
const controller = new AuthController();

// POST /api/auth/login - Authenticate user
router.post("/login", controller.login);

// POST /api/auth/logout - End session (requires auth)
router.post("/logout", sessionAuthMiddleware, controller.logout);

// GET /api/auth/me - Get current authenticated user (requires auth)
router.get("/me", sessionAuthMiddleware, controller.me);

// POST /api/auth/change-password - Change password (requires auth)
router.post(
  "/change-password",
  sessionAuthMiddleware,
  controller.changePassword
);

export { router as authRoutes };
