import { Router } from "express";
import { AlbumController } from "./album.controller";
import { sessionAuthMiddleware } from "../../middleware/auth";

const router = Router();
const controller = new AlbumController();

// All album routes require user authentication
router.use(sessionAuthMiddleware);

// GET /api/albums - List albums accessible to the authenticated user
router.get("/", controller.list);

// POST /api/albums - Create a new album
router.post("/", controller.create);

// GET /api/albums/:albumId - Get album details
router.get("/:albumId", controller.getById);

// PATCH /api/albums/:albumId - Update album metadata
router.patch("/:albumId", controller.update);

// DELETE /api/albums/:albumId - Delete an album
router.delete("/:albumId", controller.delete);

// POST /api/albums/:albumId/permissions - Set album permissions
router.post("/:albumId/permissions", controller.setPermission);

// PATCH /api/albums/:albumId/cover - Set album cover photo
router.patch("/:albumId/cover", controller.setCover);

export { router as albumRoutes };
