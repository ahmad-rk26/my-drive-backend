// // jobs/trash-purge.job.js
// import cron from "node-cron";
// import { supabase } from "../config/supabase.js";
// import * as fileService from "../services/file.service.js";
// import * as folderService from "../services/folder.service.js";

// console.log("[Trash Purge Cron] Initialized");

// // Runs every day at 2:30 AM server time
// // You can change schedule to '0 3 * * *' (3 AM), '*/30 * * * *' (every 30 min for testing), etc.
// cron.schedule("30 2 * * *", async () => {
//     console.log("[Trash Purge Cron] Starting automatic trash cleanup...");

//     try {
//         const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

//         // 1. Find and permanently delete old trashed files
//         const { data: oldFiles, error: fileErr } = await supabase
//             .from("files")
//             .select("id")
//             .eq("is_trashed", true)
//             .lt("updated_at", thirtyDaysAgo);

//         if (fileErr) throw fileErr;

//         let deletedFilesCount = 0;
//         for (const file of oldFiles || []) {
//             try {
//                 await fileService.deleteFile(file.id);
//                 deletedFilesCount++;
//             } catch (err) {
//                 console.error(`Failed to delete file ${file.id}:`, err.message);
//             }
//         }

//         // 2. Find and permanently delete old trashed folders (recursive)
//         const { data: oldFolders, error: folderErr } = await supabase
//             .from("folders")
//             .select("id")
//             .eq("is_trashed", true)
//             .lt("updated_at", thirtyDaysAgo);

//         if (folderErr) throw folderErr;

//         let deletedFoldersCount = 0;
//         for (const folder of oldFolders || []) {
//             try {
//                 await folderService.deleteFolderRecursive(folder.id);
//                 deletedFoldersCount++;
//             } catch (err) {
//                 console.error(`Failed to delete folder ${folder.id}:`, err.message);
//             }
//         }

//         console.log(
//             `[Trash Purge Cron] Completed: ${deletedFilesCount} files + ${deletedFoldersCount} folders permanently deleted`
//         );
//     } catch (error) {
//         console.error("[Trash Purge Cron] Error during cleanup:", error);
//     }
// });

// export default {}; // just to make it a module