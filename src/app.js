// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import "./jobs/trash-purge.job.js";

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
    "https://ak-drive.netlify.app",
    "http://localhost:5173",
];

// ✅ CORS configuration
app.use(
    cors({
        origin: (origin, callback) => {
            // allow requests with no origin (Postman, mobile apps)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
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

// Global error handler
app.use(errorHandler);

export default app;
