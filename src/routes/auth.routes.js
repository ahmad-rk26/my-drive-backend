import express from "express";
import { healthCheck } from "../controllers/auth.controller.js";
import { testSupabase } from "../controllers/auth.controller.js";
const router = express.Router();

router.get("/health", healthCheck);

router.get("/test-db", testSupabase);

export default router;
