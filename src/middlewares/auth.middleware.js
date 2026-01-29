// middlewares/auth.middleware.js
import { supabase } from "../config/supabase.js";

/**
 * Protect routes - verifies Supabase JWT and attaches user to req
 */
export const protect = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header (Bearer <token>)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing or invalid format. Use: Bearer <token>",
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Token missing" });
        }

        // 2. Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        // 3. Attach full user object to request
        req.user = user;

        // Optional: You can also attach user metadata or role if needed
        // req.user.role = user.user_metadata?.role || 'user';

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

/**
 * Optional: Admin-only middleware (if you later add roles)
 */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.user_metadata?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required",
        });
    }
    next();
};