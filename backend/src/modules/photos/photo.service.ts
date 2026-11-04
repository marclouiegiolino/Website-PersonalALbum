import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import prisma from "../../database/connection";
import { config } from "../../config";
import { safeResolvePath } from "../../services/storage";
import { generateThumbnail, getImageDimensions } from "../../services/image-processor";

interface FileResult {
  stream: fs.ReadStream;
  mimeType: string;
  size: number;
}

export class PhotoService {
  /**
   * Upload a photo to an album.
   * Validates album access, stores the file, generates a thumbnail,
   * and creates the database record.
   */
  async upload(
    albumId: string,
    userId: string,
    role: string,
    file: Express.Multer.File
  ) {
    // Check album exists and user has access
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return null;

    if (role !== "owner" && album.createdBy !== userId) {
      const perm = await prisma.albumPermission.findFirst({
        where: { albumId, userId, permission: "edit" },
      });
      if (!perm) return null;
    }

    // Generate unique filename to prevent collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${randomUUID()}${ext}`;

    // Save original file
    const originalsDir = path.join(
      config.storagePath,
      config.originalsDir
    );
    const originalPath = safeResolvePath(originalsDir, uniqueFilename);
    fs.writeFileSync(originalPath, file.buffer);

    // Generate thumbnail
    const thumbnailsDir = path.join(
      config.storagePath,
      config.thumbnailsDir
    );
    const thumbnailPath = safeResolvePath(thumbnailsDir, uniqueFilename);
    await generateThumbnail(originalPath, thumbnailPath);

    // Get image dimensions
    const dimensions = await getImageDimensions(originalPath);

    // Create database record
    const photo = await prisma.photo.create({
      data: {
        id: randomUUID(),
        albumId,
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        uploadedBy: userId,
      },
    });

    // Update album's updatedAt timestamp
    await prisma.album.update({
      where: { id: albumId },
      data: { updatedAt: new Date() },
    });

    // If this is the first photo, auto-set it as cover
    const photoCount = await prisma.photo.count({ where: { albumId } });
    if (photoCount === 1) {
      await prisma.album.update({
        where: { id: albumId },
        data: { coverPhotoId: photo.id },
      });
    }

    return photo;
  }

  /**
   * Get a photo file stream with access verification.
   */
  async getFile(
    photoId: string,
    userId: string,
    role: string,
    type: "original" | "thumbnail"
  ): Promise<FileResult | null> {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { album: true },
    });

    if (!photo) return null;

    // Verify access to the album
    if (role !== "owner" && photo.album.createdBy !== userId) {
      const perm = await prisma.albumPermission.findFirst({
        where: { albumId: photo.albumId, userId },
      });
      if (!perm) return null;
    }

    // Resolve file path safely
    const dir =
      type === "original"
        ? path.join(config.storagePath, config.originalsDir)
        : path.join(config.storagePath, config.thumbnailsDir);

    const filePath = safeResolvePath(dir, photo.filename);

    if (!fs.existsSync(filePath)) {
      console.error(`[Photo Service] File not found: ${filePath}`);
      return null;
    }

    const stat = fs.statSync(filePath);

    return {
      stream: fs.createReadStream(filePath),
      mimeType: photo.mimeType,
      size: stat.size,
    };
  }

  /**
   * Get photo metadata with access verification.
   */
  async getMeta(photoId: string, userId: string, role: string) {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        album: { select: { id: true, title: true, createdBy: true } },
        uploader: { select: { id: true, displayName: true } },
      },
    });

    if (!photo) return null;

    // Verify access
    if (role !== "owner" && photo.album.createdBy !== userId) {
      const perm = await prisma.albumPermission.findFirst({
        where: { albumId: photo.albumId, userId },
      });
      if (!perm) return null;
    }

    return {
      id: photo.id,
      albumId: photo.albumId,
      albumTitle: photo.album.title,
      originalName: photo.originalName,
      mimeType: photo.mimeType,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      uploadedBy: photo.uploader,
      createdAt: photo.createdAt,
    };
  }

  /**
   * Delete a photo and its files.
   */
  async delete(
    photoId: string,
    userId: string,
    role: string
  ): Promise<boolean> {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { album: true },
    });

    if (!photo) return false;

    // Only owner, album creator, or the uploader can delete
    if (
      role !== "owner" &&
      photo.album.createdBy !== userId &&
      photo.uploadedBy !== userId
    ) {
      return false;
    }

    // Delete physical files
    const originalPath = path.join(
      config.storagePath,
      config.originalsDir,
      photo.filename
    );
    const thumbnailPath = path.join(
      config.storagePath,
      config.thumbnailsDir,
      photo.filename
    );

    try {
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    } catch (err) {
      console.error("[Photo Service] Failed to delete files:", err);
    }

    // If this photo was the cover, clear the cover
    if (photo.album.coverPhotoId === photoId) {
      await prisma.album.update({
        where: { id: photo.albumId },
        data: { coverPhotoId: null, updatedAt: new Date() },
      });
    }

    // Delete database record
    await prisma.photo.delete({ where: { id: photoId } });

    return true;
  }
}
