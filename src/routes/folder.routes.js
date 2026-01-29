// routes/folder.routes.js
import { Router } from "express";
import * as folderController from "../controllers/folder.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protect, folderController.createFolder);

// Trash / Restore / Rename / Star
router.patch("/:id/trash", protect, folderController.trashFolder);
router.patch("/:id/restore", protect, folderController.restoreFolder);
router.patch("/:id/rename", protect, folderController.renameFolder);
router.patch("/:id/star", protect, folderController.toggleStarFolder);

// Permanent delete
router.delete("/:id/permanent", protect, folderController.deleteFolderPermanently);

export default router;