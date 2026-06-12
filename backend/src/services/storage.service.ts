import { Storage } from "node-appwrite";
import { createAdminClient } from "../../app";

const bucketId = () =>
  process.env.APPWRITE_STORAGE_BUCKET_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ||
  "";

export class StorageService {
  static async getFileView(fileId: string) {
    if (!bucketId()) throw new Error("Storage bucket is not configured.");
    const storage = new Storage(createAdminClient());
    return Buffer.from(await storage.getFileView(bucketId(), fileId));
  }
}
