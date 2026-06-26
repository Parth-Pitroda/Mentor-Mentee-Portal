export type EncodedUploadFile = {
  name: string;
  type: string;
  size: number;
  base64: string;
};

export type StoredFile = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size?: number;
};

export interface IStorageService {
  getFileView(fileId: string): Promise<Buffer>;
  getFile(fileId: string): Promise<StoredFile>;
  uploadFile(file: EncodedUploadFile): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
}
