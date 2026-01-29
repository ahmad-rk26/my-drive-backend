import { supabase } from "../config/supabase.js";

export const healthCheck = (req, res) => {
    res.json({
        status: "OK",
        message: "Auth service running"
    });
};


export const testSupabase = async (req, res) => {
    const { data, error } = await supabase.from("folders").select("id").limit(1);

    if (error) {
        return res.status(500).json({
            connected: false,
            error: error.message
        });
    }

    res.json({
        connected: true,
        message: "Supabase connected successfully 🎉",
        data
    });
};
