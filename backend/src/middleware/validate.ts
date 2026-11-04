import { Request, Response, NextFunction } from "express";
import { config } from "../config";

/**
 * Middleware factory that validates request body against a Zod schema.
 */
export function validateBody(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error?.issues) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validates that an uploaded file meets security requirements:
 * - File exists
 * - MIME type is in the allowed list
 * - File size is within the configured limit
 */
export function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // Check MIME type against allowlist
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    res.status(400).json({
      error: `File type "${file.mimetype}" is not allowed. Allowed types: ${config.allowedMimeTypes.join(", ")}`,
    });
    return;
  }

  // Check file size
  if (file.size > config.maxFileSizeBytes) {
    res.status(400).json({
      error: `File size exceeds the ${config.maxFileSizeMB}MB limit.`,
    });
    return;
  }

  next();
}

/**
 * Validates request query parameters against a Zod schema.
 */
export function validateQuery(schema: { parse: (data: unknown) => unknown }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (error: any) {
      if (error?.issues) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
