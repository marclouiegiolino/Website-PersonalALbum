import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/auth/login
   * Authenticate with username and password.
   * Sets an HttpOnly session cookie on success.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Input validation
      if (
        !username ||
        typeof username !== "string" ||
        !password ||
        typeof password !== "string"
      ) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      if (username.length > 50 || password.length > 128) {
        res.status(400).json({ error: "Invalid input length" });
        return;
      }

      const result = await authService.login(username, password);

      if (!result) {
        // Generic error message to prevent username enumeration
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // Set HttpOnly cookie with the session token
      res.cookie("session_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: result.expiresInMs,
        path: "/",
      });

      res.json({
        user: result.user,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      console.error("[Auth Login Error]", error);
      res.status(500).json({ error: "Login failed" });
    }
  }

  /**
   * POST /api/auth/logout
   * End the current session and clear the cookie.
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = (req as any).sessionId;

      if (sessionId) {
        await authService.logout(sessionId);
      }

      // Clear the session cookie
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth Logout Error]", error);
      res.status(500).json({ error: "Logout failed" });
    }
  }

  /**
   * GET /api/auth/me
   * Return the currently authenticated user's information.
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      res.json({ user });
    } catch (error) {
      console.error("[Auth Me Error]", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }

  /**
   * POST /api/auth/change-password
   * Change the authenticated user's password.
   * Requires current password for verification.
   * Invalidates all sessions after change.
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      // Input validation
      if (
        !currentPassword ||
        typeof currentPassword !== "string" ||
        !newPassword ||
        typeof newPassword !== "string"
      ) {
        res
          .status(400)
          .json({ error: "Current password and new password are required" });
        return;
      }

      if (newPassword.length < 8) {
        res
          .status(400)
          .json({ error: "New password must be at least 8 characters" });
        return;
      }

      if (newPassword.length > 128) {
        res.status(400).json({ error: "Password too long" });
        return;
      }

      const result = await authService.changePassword(
        user.id,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      // Clear the current session cookie (user must re-login)
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      res.json({
        success: true,
        message: "Password changed. Please log in again.",
      });
    } catch (error) {
      console.error("[Auth ChangePassword Error]", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }
}
