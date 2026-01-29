// stats.service.js
import { supabase } from "../config/supabase.js";

export const getStorageUsage = async (userId) => {
    const { data, error } = await supabase
        .from("files")
        .select("size")
        .eq("user_id", userId);

    if (error) throw error;

    return (data || []).reduce((sum, row) => sum + (Number(row.size) || 0), 0);
};