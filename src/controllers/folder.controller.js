// folder.controller.js
import * as folderService from "../services/folder.service.js";

export const createFolder = async (req, res) => {
    try {
        const data = await folderService.createFolder(req);
        res.json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// export const getFolders = async (req, res) => {
//     try {
//         const { parentId } = req.query;
//         const data = await folderService.getFolders(req.user.id, parentId);
//         res.json({ success: true, data });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

export const trashFolder = async (req, res) => {
    try {
        await folderService.trashFolderRecursive(req.params.id);
        res.json({ success: true, message: "Folder and contents moved to trash" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const restoreFolder = async (req, res) => {
    try {
        await folderService.restoreFolderRecursive(req.params.id);
        res.json({ success: true, message: "Folder and contents restored" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const renameFolder = async (req, res) => {
    try {
        const data = await folderService.renameFolder(req.params.id, req.body.name);
        res.json({ success: true, data });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const toggleStarFolder = async (req, res) => {
    try {
        const data = await folderService.toggleStarFolder(req.params.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteFolderPermanently = async (req, res) => {
    try {
        await folderService.deleteFolderRecursive(req.params.id);
        res.json({ success: true, message: "Folder and contents permanently deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};