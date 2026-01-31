// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/env.js"; // assuming this loads your .env

import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import statsRoutes from "./routes/stats.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

// Import cron job
import "./jobs/trash-purge.job.js";  // ← this will run the cron automatically on import

const app = express();

// CORS configuration (adjust origin in production)
app.use(
    cors({
        origin: "https://ak-drive.netlify.app", // ← change to your frontend URL in production
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/stats", statsRoutes);

// Global error handler (should be last)
app.use(errorHandler);

export default app;
