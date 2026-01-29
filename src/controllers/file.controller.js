// file.controller.js
import * as fileService from "../services/file.service.js";
import archiver from 'archiver';

export const uploadFiles = async (req, res) => {
    try {
        const uploaded = await fileService.uploadFilesUnified(req);
        res.json({ success: true, uploaded });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getFiles = async (req, res) => {
    try {
        const { folderId } = req.query;
        const data = await fileService.getFiles(req.user.id, folderId || null);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllItems = async (req, res) => {
    try {
        const data = await fileService.getAllItems(req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const trashFile = async (req, res) => {
    try {
        await fileService.trashFile(req.params.id);
        res.json({ success: true, message: "File moved to trash" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const restoreFile = async (req, res) => {
    try {
        await fileService.restoreFile(req.params.id);
        res.json({ success: true, message: "File restored" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const renameFile = async (req, res) => {
    try {
        const data = await fileService.renameFile(req.params.id, req.body.name);
        res.json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const deleteFilePermanently = async (req, res) => {
    try {
        await fileService.deleteFile(req.params.id);
        res.json({ success: true, message: "File permanently deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const searchItems = async (req, res) => {
    try {
        const data = await fileService.searchItems(req.user.id, req.query.q);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Recent items - now supports ?folderId= parameter
 */
export const recentItems = async (req, res) => {
    try {
        const { folderId } = req.query;
        const data = await fileService.recentItems(req.user.id, folderId || null);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Recent items error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Starred items - now supports ?folderId= parameter
 */
export const getStarredItems = async (req, res) => {
    try {
        const { folderId } = req.query;

        console.log("STARRED API HIT");
        console.log("req.user:", req.user);
        console.log("folderId:", folderId || '(root)');

        if (!req.user || !req.user.id) {
            console.log("User missing");
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const userId = req.user.id;
        const data = await fileService.getStarredItems(userId, folderId || null);

        console.log("starred data length:", data.length);

        res.json({ success: true, data });
    } catch (err) {
        console.error("STARRED CONTROLLER ERROR:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getTrashedItems = async (req, res) => {
try {
    const { folderId } = req.query;
    const userId = req.user.id;
    const trashed = await fileService.getTrashedItems(userId, folderId || null);
    res.json({ success: true, data: trashed });
} catch (err) {
    console.error('Trash fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to load trash' });
}
};

export const toggleStar = async (req, res) => {
    try {
        const data = await fileService.toggleStar(req.params.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const signedUrl = await fileService.getDownloadUrl(id, req.user.id);
        res.json({ success: true, url: signedUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const downloadFolderAsZip = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data: folder } = await supabase
            .from('folders')
            .select('name')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!folder) throw new Error('Folder not found');

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename="${folder.name}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        await fileService.appendFilesToArchive(archive, id, '', userId);

        archive.finalize();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};