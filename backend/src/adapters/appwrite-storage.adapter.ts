import { ID, Storage } from "node-appwrite";
import { EncodedUploadFile, IStorageService, StoredFile } from "../interface/storage.interface";
const { InputFile } = require("node-appwrite/file");

export class AppwriteStorageAdapter implements IStorageService {
  private storage: Storage;
  private bucketId: string;

  constructor(client: any) {
    this.storage = new Storage(client);
    this.bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
  }

  async getFileView(fileId: string): Promise<Buffer> {
    return Buffer.from(await this.storage.getFileView(this.bucketId, fileId));
  }

  async getFile(fileId: string): Promise<StoredFile> {
    const [metadata, buffer] = await Promise.all([
      this.storage.getFile(this.bucketId, fileId) as Promise<any>,
      this.getFileView(fileId),
    ]);

    return {
      buffer,
      fileName: metadata.name || `${fileId}${extensionFromMime(metadata.mimeType)}`,
      mimeType: metadata.mimeType || mimeFromFileName(metadata.name) || "application/octet-stream",
      size: metadata.sizeOriginal,
    };
  }

  async uploadFile(file: EncodedUploadFile): Promise<string> {
    const inputFile = InputFile.fromBuffer(Buffer.from(file.base64, "base64"), file.name);
    const uploaded = await this.storage.createFile(this.bucketId, ID.unique(), inputFile);
    return uploaded.$id;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.storage.deleteFile(this.bucketId, fileId);
  }
}

function extensionFromMime(mimeType?: string): string {
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "text/csv":
      return ".csv";
    default:
      return "";
  }
}

function mimeFromFileName(fileName?: string): string | null {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "csv":
      return "text/csv";
    default:
      return null;
  }
}
