// file.service.js
import { supabase } from "../config/supabase.js";
import { v4 as uuid } from "uuid";
import path from 'path';

export const uploadFilesUnified = async (req) => {
    const files = req.files; // array from multer .array('files')
    if (!files || files.length === 0) throw new Error('No files provided');

    const folderId = req.body.folderId || null;
    const userId = req.user.id;

    const uploadedFiles = [];

    // Check if this is a folder upload (any file has webkitRelativePath)
    const isFolderUpload = files.some(file => file.webkitRelativePath && file.webkitRelativePath !== file.originalname);

    if (isFolderUpload) {
        // ──────────────── FOLDER UPLOAD ────────────────
        const folderMap = new Map();
        folderMap.set('', folderId); // root folder (current or null)

        // Sort files by path depth (parents first)
        files.sort((a, b) => {
            const depthA = (a.webkitRelativePath || a.originalname).split('/').length;
            const depthB = (b.webkitRelativePath || b.originalname).split('/').length;
            return depthA - depthB;
        });

        for (const file of files) {
            const relativePath = file.webkitRelativePath || file.originalname;
            const dirPath = path.dirname(relativePath);
            const fileName = path.basename(relativePath);

            let parentId = folderId;
            let currentPath = '';

            // Create folders recursively if needed
            for (const part of dirPath.split('/')) {
                if (!part || part === '.') continue;
                currentPath = path.join(currentPath, part);

                if (!folderMap.has(currentPath)) {
                    const { data: newFolder, error } = await supabase
                        .from('folders')
                        .insert({
                            name: part,
                            parent_id: parentId,
                            user_id: userId,
                            is_trashed: false,
                            is_starred: false,
                        })
                        .select('id')
                        .single();

                    if (error) throw new Error(`Folder creation failed: ${error.message}`);
                    folderMap.set(currentPath, newFolder.id);
                }
                parentId = folderMap.get(currentPath);
            }

            // Upload file
            const storagePath = `${userId}/${uuid()}-${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from("drive")
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype || 'application/octet-stream',
                });

            if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

            // Insert into DB
            const { data: inserted, error: insertError } = await supabase
                .from("files")
                .insert({
                    user_id: userId,
                    folder_id: parentId,
                    name: fileName,
                    storage_path: storagePath,
                    size: file.size,
                    type: file.mimetype,
                    is_trashed: false,
                    is_starred: false,
                })
                .select()
                .single();

            if (insertError) {
                await supabase.storage.from("drive").remove([storagePath]);
                throw new Error(`DB insert failed: ${insertError.message}`);
            }

            uploadedFiles.push(inserted);
        }
    } else {
        // ──────────────── FLAT FILES (single or multiple) ────────────────
        for (const file of files) {
            const storagePath = `${userId}/${uuid()}-${file.originalname}`;

            const { error: uploadError } = await supabase.storage
                .from("drive")
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype || 'application/octet-stream',
                });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { data, error: insertError } = await supabase
                .from("files")
                .insert({
                    user_id: userId,
                    folder_id: folderId,
                    name: file.originalname,
                    storage_path: storagePath,
                    size: file.size,
                    type: file.mimetype,
                    is_trashed: false,
                    is_starred: false,
                })
                .select()
                .single();

            if (insertError) {
                await supabase.storage.from("drive").remove([storagePath]);
                throw new Error(`DB insert failed: ${insertError.message}`);
            }

            uploadedFiles.push(data);
        }
    }

    return uploadedFiles;
};



export const getFiles = async (userId, folderId = null) => {
    // ─── FILES ────────────────────────────────────────
    let fileQuery = supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name", { ascending: true });

    if (folderId) {
        fileQuery = fileQuery.eq("folder_id", folderId);
    } else {
        fileQuery = fileQuery.is("folder_id", null);
    }

    const { data: files = [], error: fileError } = await fileQuery;
    if (fileError) throw fileError;

    // ─── FOLDERS ──────────────────────────────────────
    let folderQuery = supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name", { ascending: true });

    if (folderId) {
        folderQuery = folderQuery.eq("parent_id", folderId);
    } else {
        folderQuery = folderQuery.is("parent_id", null);
    }

    const { data: folders = [], error: folderError } = await folderQuery;
    if (folderError) throw folderError;

    // Combine and tag type
    const combined = [
        ...folders.map(folder => ({ ...folder, type: 'folder' })),
        ...files.map(file => ({ ...file, type: 'file' })),
    ];

    // Optional: sort everything together by name
    combined.sort((a, b) => a.name.localeCompare(b.name));

    return combined;
};

export const getAllItems = async (userId) => {
    const { data: files, error: fErr } = await supabase
        .from("files")
        .select("*, type:literal('file')")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name");

    if (fErr) throw fErr;

    const { data: folders, error: foldErr } = await supabase
        .from("folders")
        .select("*, type:literal('folder')")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("name");

    if (foldErr) throw foldErr;

    return [...(files || []), ...(folders || [])];
};

export const trashFile = async (id) => {
    const { error } = await supabase
        .from("files")
        .update({ is_trashed: true, updated_at: new Date().toISOString() })
        .eq("id", id);
    if (error) throw error;
};

export const restoreFile = async (id) => {
    const { error } = await supabase
        .from("files")
        .update({ is_trashed: false, updated_at: new Date().toISOString() })
        .eq("id", id);
    if (error) throw error;
};

export const renameFile = async (id, name) => {
    if (!name?.trim()) throw new Error("Name is required");
    const { data, error } = await supabase
        .from("files")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteFile = async (id) => {
    const { data: file, error: fetchErr } = await supabase
        .from("files")
        .select("is_trashed, storage_path")
        .eq("id", id)
        .single();

    if (fetchErr || !file) throw new Error("File not found");
    if (!file.is_trashed) throw new Error("File must be in trash before permanent deletion");

    const { error: removeErr } = await supabase.storage
        .from("drive")
        .remove([file.storage_path]);

    if (removeErr) throw removeErr;

    const { error: delErr } = await supabase.from("files").delete().eq("id", id);
    if (delErr) throw delErr;
};

export const toggleStar = async (id) => {
    const { data: current, error: fetchErr } = await supabase
        .from("files")
        .select("is_starred")
        .eq("id", id)
        .single();

    if (fetchErr || !current) throw new Error("File not found");

    const { data, error } = await supabase
        .from("files")
        .update({ is_starred: !current.is_starred, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getDownloadUrl = async (fileId, userId) => {
    const { data: file, error } = await supabase
        .from("files")
        .select("storage_path")
        .eq("id", fileId)
        .eq("user_id", userId)
        .single();

    if (error || !file) throw new Error("File not found or access denied");

    const { data: urlData, error: urlErr } = await supabase.storage
        .from("drive")
        .createSignedUrl(file.storage_path, 3600); // 1 hour

    if (urlErr) throw urlErr;

    return urlData.signedUrl;
};

export const searchItems = async (userId, query) => {
    if (!query || !query.trim()) return [];

    const term = `%${query.trim()}%`;

    //  Search files
    const { data: files, error: fileError } = await supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .ilike("name", term);

    if (fileError) throw fileError;

    //  Search folders
    const { data: folders, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .ilike("name", term);

    if (folderError) throw folderError;

    // 🏷 Attach type in JS
    const taggedFiles = (files || []).map(f => ({
        ...f,
        type: "file"
    }));

    const taggedFolders = (folders || []).map(f => ({
        ...f,
        type: "folder"
    }));

    return [...taggedFiles, ...taggedFolders];
};


export const recentItems = async (userId, folderId = null) => {
    const now = new Date();

    // ─── FILES ────────────────────────────────────────
    let fileQuery = supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("updated_at", { ascending: false })
        .limit(50);

    if (folderId) {
        fileQuery = fileQuery.eq("folder_id", folderId);
    }

    const { data: files = [], error: fileError } = await fileQuery;
    if (fileError) throw fileError;

    // ─── FOLDERS ──────────────────────────────────────
    let folderQuery = supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_trashed", false)
        .order("updated_at", { ascending: false })
        .limit(50);

    if (folderId) {
        folderQuery = folderQuery.eq("parent_id", folderId);
    }

    const { data: folders = [], error: folderError } = await folderQuery;
    if (folderError) throw folderError;

    // Tag types
    const taggedFiles = files.map(f => ({ ...f, type: "file" }));
    const taggedFolders = folders.map(f => ({ ...f, type: "folder" }));

    // Merge and sort by updated_at descending (most recent first)
    const combined = [...taggedFiles, ...taggedFolders].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    // Limit to ~50 after sorting (optional - you can adjust)
    return combined.slice(0, 50);
};

export const getTrashedItems = async (userId, folderId = null) => {
    try {
        // Trashed Files
        let fileQuery = supabase
            .from("files")
            .select("*")
            .eq("user_id", userId)
            .eq("is_trashed", true)
            .order("updated_at", { ascending: false });

        if (folderId) {
            fileQuery = fileQuery.eq("folder_id", folderId);
        }

        const { data: files, error: fileErr } = await fileQuery;
        if (fileErr) throw fileErr;

        // Trashed Folders
        let folderQuery = supabase
            .from("folders")
            .select("*")
            .eq("user_id", userId)
            .eq("is_trashed", true)
            .order("updated_at", { ascending: false });

        if (folderId) {
            folderQuery = folderQuery.eq("parent_id", folderId);
        }

        const { data: folders, error: folderErr } = await folderQuery;
        if (folderErr) throw folderErr;

        const typedFiles = (files || []).map(f => ({ ...f, type: 'file' }));
        const typedFolders = (folders || []).map(f => ({ ...f, type: 'folder' }));

        return [...typedFiles, ...typedFolders];
    } catch (err) {
        console.error('getTrashedItems error:', err);
        throw err;
    }
};

export const getStarredItems = async (userId, folderId = null) => {
    console.log("📦 getStarredItems called - userId:", userId, "folderId:", folderId);

    // ─── STARRED FILES ────────────────────────────────
    let fileQuery = supabase
        .from("files")
        .select("*")
        .eq("user_id", userId)
        .eq("is_starred", true)
        .eq("is_trashed", false);

    if (folderId) {
        fileQuery = fileQuery.eq("folder_id", folderId);
    }

    const { data: files, error: fileError } = await fileQuery;
    if (fileError) {
        console.error("❌ FILE QUERY ERROR:", fileError);
        throw fileError;
    }

    // ─── STARRED FOLDERS ──────────────────────────────
    let folderQuery = supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
        .eq("is_starred", true)
        .eq("is_trashed", false);

    if (folderId) {
        folderQuery = folderQuery.eq("parent_id", folderId);
    }

    const { data: folders, error: folderError } = await folderQuery;
    if (folderError) {
        console.error("❌ FOLDER QUERY ERROR:", folderError);
        throw folderError;
    }

    // Tag types and combine
    return [
        ... (files || []).map(f => ({ ...f, type: "file" })),
        ... (folders || []).map(f => ({ ...f, type: "folder" })),
    ].sort((a, b) => a.name.localeCompare(b.name));  // or keep no sort, or sort by updated_at
};

export const appendFilesToArchive = async (archive, folderId, currentPath, userId) => {
    const { data: files } = await supabase
        .from("files")
        .select("*")
        .eq("folder_id", folderId)
        .eq("user_id", userId)
        .eq("is_trashed", false);

    for (const file of files || []) {
        const { data: fileData } = await supabase.storage
            .from("drive")
            .download(file.storage_path);

        if (fileData) {
            archive.append(fileData, { name: `${currentPath}${file.name}` });
        }
    }

    const { data: subfolders } = await supabase
        .from("folders")
        .select("*")
        .eq("parent_id", folderId)
        .eq("user_id", userId)
        .eq("is_trashed", false);

    for (const sub of subfolders || []) {
        await appendFilesToArchive(archive, sub.id, `${currentPath}${sub.name}/`, userId);
    }
};