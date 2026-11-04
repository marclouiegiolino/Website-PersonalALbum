import { Request, Response } from "express";
import { AlbumService } from "./album.service";

const albumService = new AlbumService();

export class AlbumController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albums = await albumService.listForUser(user.id, user.role);
      res.json({ albums });
    } catch (error) {
      console.error("[Album List Error]", error);
      res.status(500).json({ error: "Failed to list albums" });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { title, description } = req.body;

      if (!title || typeof title !== "string" || title.trim().length === 0) {
        res.status(400).json({ error: "Album title is required" });
        return;
      }

      const album = await albumService.create({
        title: title.trim(),
        description: description?.trim() || null,
        createdBy: user.id,
      });

      res.status(201).json({ album });
    } catch (error) {
      console.error("[Album Create Error]", error);
      res.status(500).json({ error: "Failed to create album" });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;

      const album = await albumService.getById(albumId, user.id, user.role);

      if (!album) {
        res.status(404).json({ error: "Album not found" });
        return;
      }

      res.json({ album });
    } catch (error) {
      console.error("[Album Get Error]", error);
      res.status(500).json({ error: "Failed to get album" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;
      const { title, description } = req.body;

      const album = await albumService.update(
        albumId,
        user.id,
        user.role,
        { title: title?.trim(), description: description?.trim() }
      );

      if (!album) {
        res.status(404).json({ error: "Album not found or access denied" });
        return;
      }

      res.json({ album });
    } catch (error) {
      console.error("[Album Update Error]", error);
      res.status(500).json({ error: "Failed to update album" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;

      const success = await albumService.delete(albumId, user.id, user.role);

      if (!success) {
        res.status(404).json({ error: "Album not found or access denied" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Album Delete Error]", error);
      res.status(500).json({ error: "Failed to delete album" });
    }
  }

  async setPermission(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;
      const { userId, permission } = req.body;

      if (!userId || !permission) {
        res.status(400).json({ error: "userId and permission are required" });
        return;
      }

      if (!["view", "edit"].includes(permission)) {
        res.status(400).json({ error: "Permission must be 'view' or 'edit'" });
        return;
      }

      const result = await albumService.setPermission(
        albumId,
        user.id,
        user.role,
        userId,
        permission
      );

      if (!result) {
        res.status(404).json({ error: "Album not found or access denied" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Album Permission Error]", error);
      res.status(500).json({ error: "Failed to set permission" });
    }
  }

  async setCover(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;
      const { photoId } = req.body;

      if (!photoId) {
        res.status(400).json({ error: "photoId is required" });
        return;
      }

      const result = await albumService.setCover(
        albumId,
        user.id,
        user.role,
        photoId
      );

      if (!result) {
        res
          .status(404)
          .json({ error: "Album or photo not found, or access denied" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Album Cover Error]", error);
      res.status(500).json({ error: "Failed to set cover" });
    }
  }
}
