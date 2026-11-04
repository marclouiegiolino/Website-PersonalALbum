import { Request, Response } from "express";
import { PhotoService } from "./photo.service";

const photoService = new PhotoService();

export class PhotoController {
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const albumId = req.params.albumId as string;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const photo = await photoService.upload(
        albumId,
        user.id,
        user.role,
        file
      );

      if (!photo) {
        res.status(404).json({ error: "Album not found or access denied" });
        return;
      }

      res.status(201).json({ photo });
    } catch (error) {
      console.error("[Photo Upload Error]", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  }

  async getPhoto(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const photoId = req.params.photoId as string;

      const result = await photoService.getFile(
        photoId,
        user.id,
        user.role,
        "original"
      );

      if (!result) {
        res.status(404).json({ error: "Photo not found or access denied" });
        return;
      }

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Length", result.size);
      res.setHeader(
        "Cache-Control",
        "private, max-age=3600, must-revalidate"
      );
      result.stream.pipe(res);
    } catch (error) {
      console.error("[Photo Get Error]", error);
      res.status(500).json({ error: "Failed to retrieve photo" });
    }
  }

  async getThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const photoId = req.params.photoId as string;

      const result = await photoService.getFile(
        photoId,
        user.id,
        user.role,
        "thumbnail"
      );

      if (!result) {
        res.status(404).json({ error: "Photo not found or access denied" });
        return;
      }

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Length", result.size);
      res.setHeader("Cache-Control", "private, max-age=86400");
      result.stream.pipe(res);
    } catch (error) {
      console.error("[Photo Thumbnail Error]", error);
      res.status(500).json({ error: "Failed to retrieve thumbnail" });
    }
  }

  async getMeta(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const photoId = req.params.photoId as string;

      const meta = await photoService.getMeta(photoId, user.id, user.role);

      if (!meta) {
        res.status(404).json({ error: "Photo not found or access denied" });
        return;
      }

      res.json({ photo: meta });
    } catch (error) {
      console.error("[Photo Meta Error]", error);
      res.status(500).json({ error: "Failed to retrieve photo metadata" });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const photoId = req.params.photoId as string;

      const success = await photoService.delete(photoId, user.id, user.role);

      if (!success) {
        res.status(404).json({ error: "Photo not found or access denied" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Photo Delete Error]", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  }
}
