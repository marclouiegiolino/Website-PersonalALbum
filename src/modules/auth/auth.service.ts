import argon2 from "argon2";
import { randomUUID, randomBytes } from "crypto";
import prisma from "../../database/connection";
import { config } from "../../config";

/**
 * Argon2id hashing configuration.
 * These parameters provide strong security while keeping login time reasonable.
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 parallel threads
};

export class AuthService {
  /**
   * Authenticate a user with username and password.
   * Returns session token and user info on success, null on failure.
   *
   * Security:
   * - Constant-time comparison via Argon2id verify
   * - Cryptographically secure 256-bit session token
   * - Session stored server-side in SQLite
   */
  async login(
    username: string,
    password: string
  ): Promise<{
    user: { id: string; username: string; displayName: string; role: string };
    token: string;
    expiresAt: Date;
    expiresInMs: number;
  } | null> {
    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      // Perform a dummy hash to prevent timing attacks that reveal
      // whether a username exists
      await argon2.hash("dummy-password", ARGON2_OPTIONS);
      return null;
    }

    // Verify password with Argon2id (constant-time comparison)
    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      return null;
    }

    // Generate a cryptographically secure 256-bit session token
    const token = randomBytes(32).toString("hex");
    const expiresInMs = config.sessionExpiryHours * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    // Store session in database
    await prisma.session.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      token,
      expiresAt,
      expiresInMs,
    };
  }

  /**
   * End a user session by deleting it from the database.
   */
  async logout(sessionId: string): Promise<void> {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // Session may already be deleted; ignore
    });
  }

  /**
   * Change a user's password.
   * Requires the current password for verification.
   * Invalidates all existing sessions after password change.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    // Fetch the user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Verify current password
    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters",
      };
    }

    if (newPassword === currentPassword) {
      return {
        success: false,
        error: "New password must be different from current password",
      };
    }

    // Hash the new password with Argon2id
    const newPasswordHash = await argon2.hash(newPassword, ARGON2_OPTIONS);

    // Update password and invalidate all existing sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    return { success: true };
  }

  /**
   * Clean up all expired sessions (housekeeping).
   * Called on server startup and can be called periodically.
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  /**
   * Get count of active sessions for a user.
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    return prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
