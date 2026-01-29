// routes/file.routes.js
import { Router } from "express";
import multer from "multer";
import * as fileController from "../controllers/file.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; // assuming you have JWT/auth middleware

const router = Router();

// Multer setup (you can move this to a separate config file)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per file
});

router.post('/upload', protect, upload.array('files', 200), fileController.uploadFiles);

// List files in folder / root
router.get("/", protect, fileController.getFiles);

// All items (files + folders) flat list
router.get("/all", protect, fileController.getAllItems);

// Trash / Restore / Rename / Star
router.patch("/:id/trash", protect, fileController.trashFile);
router.patch("/:id/restore", protect, fileController.restoreFile);
router.patch("/:id/rename", protect, fileController.renameFile);
router.patch("/:id/star", protect, fileController.toggleStar);

// Download
router.get("/:id/download", protect, fileController.downloadFile);

// Permanent delete
router.delete("/:id/permanent", protect, fileController.deleteFilePermanently);

// Search & Recent
router.get("/search", protect, fileController.searchItems);
router.get("/recent", protect, fileController.recentItems);

// Folder ZIP download
router.get("/folder/:id/zip", protect, fileController.downloadFolderAsZip);

router.get('/trashed', protect, fileController.getTrashedItems);

// routes/file.routes.js
router.get('/starred', protect, fileController.getStarredItems);
export default router;