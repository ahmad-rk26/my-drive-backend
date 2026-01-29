// folder.service.js
import { supabase } from "../config/supabase.js";
import * as fileService from "./file.service.js";

export const createFolder = async (req) => {
    const { name, parentId } = req.body;
    const userId = req.user.id;

    if (!name?.trim()) throw new Error("Folder name is required");

    const { data, error } = await supabase
        .from("folders")
        .insert({
            name: name.trim(),
            parent_id: parentId || null,
            user_id: userId,
            is_trashed: false,
            is_starred: false,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create folder: ${error.message}`);
    return data;
};

// export const getFolders = async (userId, parentId) => {
//     let query = supabase
//         .from("folders")
//         .select("*")
//         .eq("user_id", userId)
//         .eq("is_trashed", false)
//         .order("name", { ascending: true });

//     if (parentId && parentId.trim()) {
//         query = query.eq("parent_id", parentId.trim());
//     } else {
//         query = query.is("parent_id", null);
//     }

//     const { data, error } = await query;
//     if (error) throw error;
//     return data || [];
// };

export const trashFolderRecursive = async (folderId) => {
    const now = new Date().toISOString();

    await supabase
        .from("folders")
        .update({ is_trashed: true, updated_at: now })
        .eq("id", folderId);

    await supabase
        .from("files")
        .update({ is_trashed: true, updated_at: now })
        .eq("folder_id", folderId);

    const { data: children } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folderId)
        .eq("is_trashed", false);

    for (const child of children || []) {
        await trashFolderRecursive(child.id);
    }
};

export const restoreFolderRecursive = async (folderId) => {
    const now = new Date().toISOString();

    await supabase
        .from("folders")
        .update({ is_trashed: false, updated_at: now })
        .eq("id", folderId);

    await supabase
        .from("files")
        .update({ is_trashed: false, updated_at: now })
        .eq("folder_id", folderId);

    const { data: children } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folderId);

    for (const child of children || []) {
        await restoreFolderRecursive(child.id);
    }
};

export const renameFolder = async (id, name) => {
    if (!name?.trim()) throw new Error("Name is required");

    const { data, error } = await supabase
        .from("folders")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const toggleStarFolder = async (id) => {
    const { data: current, error: fetchErr } = await supabase
        .from("folders")
        .select("is_starred")
        .eq("id", id)
        .single();

    if (fetchErr || !current) throw new Error("Folder not found");

    const { data, error } = await supabase
        .from("folders")
        .update({ is_starred: !current.is_starred, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteFolderRecursive = async (folderId) => {
    const { data: folder } = await supabase
        .from("folders")
        .select("is_trashed")
        .eq("id", folderId)
        .single();

    if (!folder?.is_trashed) throw new Error("Must be in trash before permanent deletion");

    // Delete files in this folder
    const { data: files } = await supabase
        .from("files")
        .select("id")
        .eq("folder_id", folderId);

    for (const f of files || []) {
        await fileService.deleteFile(f.id);
    }

    // Recurse children
    const { data: children } = await supabase
        .from("folders")
        .select("id")
        .eq("parent_id", folderId);

    for (const child of children || []) {
        await deleteFolderRecursive(child.id);
    }

    // Delete self
    await supabase.from("folders").delete().eq("id", folderId);
};