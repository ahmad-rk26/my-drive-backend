// stats.controller.js
import * as statsService from "../services/stats.service.js";

export const getStorageUsage = async (req, res) => {
    try {
        const bytes = await statsService.getStorageUsage(req.user.id);
        res.json({ success: true, bytes, readable: `${(bytes / (1024 * 1024)).toFixed(2)} MB` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};