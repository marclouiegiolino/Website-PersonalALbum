import fs from "fs";
import path from "path";
import multer from "multer";
import { config } from "../config";

/**
 * Ensure all required storage directories exist.
 * Called on server startup.
 */
export async function ensureStorageDirectories(): Promise<void> {
  const dirs = [
    config.storagePath,
    path.join(config.storagePath, config.originalsDir),
    path.join(config.storagePath, config.thumbnailsDir),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Storage] Created directory: ${dir}`);
    }
  }
}

/**
 * Safely resolve a file path within a base directory.
 * Prevents path traversal attacks by ensuring the resolved path
 * stays within the allowed base directory.
 *
 * @throws Error if the resolved path escapes the base directory
 */
export function safeResolvePath(baseDir: string, filename: string): string {
  // Sanitize the filename: remove any directory components
  const sanitizedFilename = path.basename(filename);

  // Resolve to an absolute path
  const resolvedPath = path.resolve(baseDir, sanitizedFilename);

  // Verify the resolved path is within the base directory
  const normalizedBase = path.resolve(baseDir) + path.sep;
  const normalizedResolved = path.resolve(resolvedPath);

  if (!normalizedResolved.startsWith(normalizedBase.slice(0, -1))) {
    throw new Error(
      `Path traversal detected: "${filename}" resolves outside of "${baseDir}"`
    );
  }

  return resolvedPath;
}

/**
 * Multer middleware configured for memory storage.
 * Files are stored in memory as Buffer objects for processing
 * before being written to the private storage directory.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type "${file.mimetype}" is not allowed. Allowed: ${config.allowedMimeTypes.join(", ")}`
        )
      );
    }
  },
});

/**
 * Get the size of a file in bytes.
 * Returns 0 if the file doesn't exist.
 */
export function getFileSize(filePath: string): number {
  try {
    const stat = fs.statSync(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}
