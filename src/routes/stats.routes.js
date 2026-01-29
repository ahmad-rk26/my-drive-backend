// routes/stats.routes.js
import { Router } from "express";
import * as statsController from "../controllers/stats.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/usage", protect, statsController.getStorageUsage);

export default router;