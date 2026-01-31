// // app.js
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import "./config/env.js";

// import authRoutes from "./routes/auth.routes.js";
// import fileRoutes from "./routes/file.routes.js";
// import folderRoutes from "./routes/folder.routes.js";
// import statsRoutes from "./routes/stats.routes.js";

// import { errorHandler } from "./middlewares/error.middleware.js";

// // cron job
// import "./jobs/trash-purge.job.js";

// const app = express();

// /* ======================
//    CORS CONFIG (SAFE)
//    ====================== */

// const allowedOrigins = [
//     "http://localhost:5173",
//     "https://ak-drive.netlify.app",
// ];

// app.use(
//     cors({
//         origin: (origin, callback) => {
//             if (!origin) return callback(null, true);

//             if (allowedOrigins.includes(origin)) {
//                 callback(null, true);
//             } else {
//                 callback(new Error("CORS not allowed"));
//             }
//         },
//         credentials: true,
//         methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//         allowedHeaders: ["Content-Type", "Authorization"],
//     })
// );

// /* ======================
//    MIDDLEWARES
//    ====================== */

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(cookieParser());

// /* ======================
//    ROUTES
//    ====================== */

// app.use("/api/auth", authRoutes);
// app.use("/api/files", fileRoutes);
// app.use("/api/folders", folderRoutes);
// app.use("/api/stats", statsRoutes);

// /* ======================
//    ERROR HANDLER
//    ====================== */

// app.use(errorHandler);

// export default app;


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import fileRoutes from "./routes/file.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import statsRoutes from "./routes/stats.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

/* ===== CORS ===== */

const allowedOrigins = [
    "http://localhost:5173",
    "https://ak-drive.netlify.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error("CORS not allowed"));
        },
        credentials: true,
    })
);

/* ===== MIDDLEWARES ===== */

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

/* ===== ROUTES ===== */

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/stats", statsRoutes);

/* ===== ERROR HANDLER ===== */

app.use(errorHandler);

export default app;
