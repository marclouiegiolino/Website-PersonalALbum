import { randomUUID } from "crypto";
import prisma from "../../database/connection";

interface CreateAlbumInput {
  title: string;
  description: string | null;
  createdBy: string;
}

interface UpdateAlbumInput {
  title?: string;
  description?: string;
}

export class AlbumService {
  /**
   * List all albums the user can access.
   * - Owner sees all albums.
   * - Partner sees albums they created + albums with explicit permission.
   */
  async listForUser(userId: string, role: string) {
    if (role === "owner") {
      return prisma.album.findMany({
        include: {
          _count: { select: { photos: true } },
          coverPhoto: true,
          creator: { select: { id: true, displayName: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    return prisma.album.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { permissions: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { photos: true } },
        coverPhoto: true,
        creator: { select: { id: true, displayName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Get a single album by ID with access check.
   */
  async getById(albumId: string, userId: string, role: string) {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        photos: {
          orderBy: { createdAt: "desc" },
          include: {
            uploader: { select: { id: true, displayName: true } },
          },
        },
        coverPhoto: true,
        creator: { select: { id: true, displayName: true } },
        permissions: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
        _count: { select: { photos: true } },
      },
    });

    if (!album) return null;

    // Access check
    if (role !== "owner" && album.createdBy !== userId) {
      const hasPermission = album.permissions.some((p: { userId: string }) => p.userId === userId);
      if (!hasPermission) return null;
    }

    return album;
  }

  /**
   * Create a new album.
   */
  async create(input: CreateAlbumInput) {
    return prisma.album.create({
      data: {
        id: randomUUID(),
        title: input.title,
        description: input.description,
        createdBy: input.createdBy,
      },
      include: {
        _count: { select: { photos: true } },
        creator: { select: { id: true, displayName: true } },
      },
    });
  }

  /**
   * Update album metadata.
   */
  async update(
    albumId: string,
    userId: string,
    role: string,
    input: UpdateAlbumInput
  ) {
    // Check access
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return null;

    if (role !== "owner" && album.createdBy !== userId) {
      // Check for edit permission
      const perm = await prisma.albumPermission.findFirst({
        where: { albumId, userId, permission: "edit" },
      });
      if (!perm) return null;
    }

    return prisma.album.update({
      where: { id: albumId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        updatedAt: new Date(),
      },
      include: {
        _count: { select: { photos: true } },
        creator: { select: { id: true, displayName: true } },
      },
    });
  }

  /**
   * Delete an album and its photos.
   */
  async delete(
    albumId: string,
    userId: string,
    role: string
  ): Promise<boolean> {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return false;

    // Only owner or album creator can delete
    if (role !== "owner" && album.createdBy !== userId) return false;

    // Delete album (cascade deletes photos, permissions via Prisma)
    await prisma.album.delete({ where: { id: albumId } });
    return true;
  }

  /**
   * Set permission for a user on an album.
   */
  async setPermission(
    albumId: string,
    requesterId: string,
    requesterRole: string,
    targetUserId: string,
    permission: string
  ): Promise<boolean> {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return false;

    // Only owner or album creator can manage permissions
    if (requesterRole !== "owner" && album.createdBy !== requesterId)
      return false;

    // Upsert the permission
    await prisma.albumPermission.upsert({
      where: {
        albumId_userId: { albumId, userId: targetUserId },
      },
      update: { permission },
      create: {
        id: randomUUID(),
        albumId,
        userId: targetUserId,
        permission,
      },
    });

    return true;
  }

  /**
   * Set the cover photo for an album.
   */
  async setCover(
    albumId: string,
    userId: string,
    role: string,
    photoId: string
  ): Promise<boolean> {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) return false;

    if (role !== "owner" && album.createdBy !== userId) return false;

    // Verify photo belongs to this album
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, albumId },
    });
    if (!photo) return false;

    await prisma.album.update({
      where: { id: albumId },
      data: { coverPhotoId: photoId, updatedAt: new Date() },
    });

    return true;
  }
}
