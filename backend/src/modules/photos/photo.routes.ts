import { Router } from "express";
import { PhotoController } from "./photo.controller";
import { sessionAuthMiddleware } from "../../middleware/auth";
import { validateUploadedFile } from "../../middleware/validate";
import { uploadMiddleware } from "../../services/storage";

const router = Router();
const controller = new PhotoController();

// All photo routes require user authentication
router.use(sessionAuthMiddleware);

// POST /api/photos/upload/:albumId - Upload a photo to an album
router.post(
  "/upload/:albumId",
  uploadMiddleware.single("photo"),
  validateUploadedFile,
  controller.upload
);

// GET /api/photos/:photoId - Get photo file (original)
router.get("/:photoId", controller.getPhoto);

// GET /api/photos/:photoId/thumbnail - Get photo thumbnail
router.get("/:photoId/thumbnail", controller.getThumbnail);

// GET /api/photos/:photoId/meta - Get photo metadata
router.get("/:photoId/meta", controller.getMeta);

// DELETE /api/photos/:photoId - Delete a photo
router.delete("/:photoId", controller.delete);

export { router as photoRoutes };
