import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { error } = await supabase
            .from("files") 
            .select("id", { head: true });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Supabase is active",
            time: new Date()
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Keep-alive failed",
            error: err.message
        });
    }
});

export default router;