import sharp from "sharp";
import { config } from "../config";

/**
 * Generate a thumbnail from a source image.
 *
 * @param sourcePath - Path to the original image
 * @param destPath - Path to save the thumbnail
 */
export async function generateThumbnail(
  sourcePath: string,
  destPath: string
): Promise<void> {
  await sharp(sourcePath)
    .resize(config.thumbnail.width, config.thumbnail.height, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: config.thumbnail.quality })
    .toFile(destPath);
}

/**
 * Get the dimensions of an image.
 *
 * @param imagePath - Path to the image file
 * @returns Object with width and height
 */
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Validate that a file is a real image by checking its magic bytes.
 * This is an additional security layer beyond MIME type checking.
 *
 * @param buffer - The file buffer to validate
 * @returns true if the file appears to be a valid image
 */
export async function validateImageMagicBytes(
  buffer: Buffer
): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    const validFormats = ["jpeg", "png", "webp", "gif"];
    return metadata.format !== undefined && validFormats.includes(metadata.format);
  } catch {
    return false;
  }
}
