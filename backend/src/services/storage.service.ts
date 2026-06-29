import { servicesContainer } from "../config/providers";

const bucketId = () =>
  process.env.APPWRITE_STORAGE_BUCKET_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ||
  "";

export class StorageService {
  static async getFile(fileId: string) {
    if (!bucketId()) throw new Error("Storage bucket is not configured.");
    return servicesContainer.getStorageService().getFile(fileId);
  }

  static async getFileView(fileId: string) {
    if (!bucketId()) throw new Error("Storage bucket is not configured.");
    return servicesContainer.getStorageService().getFileView(fileId);
  }
}
