import { servicesContainer } from "../config/providers";

const bucketId = () =>
  process.env.APPWRITE_STORAGE_BUCKET_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ||
  "";

export class StorageService {
  /**
   * Used in StorageController.view (GET /api/storage/files/:fileId/view)
   */
  static async getFile(fileId: string) {
    if (!bucketId()) throw new Error("Storage bucket is not configured.");
    return servicesContainer.getStorageService().getFile(fileId);
  }

  /**
   * Currently unused directly in routes (Service helper method)
   */
  static async getFileView(fileId: string) {
    if (!bucketId()) throw new Error("Storage bucket is not configured.");
    return servicesContainer.getStorageService().getFileView(fileId);
  }
}
