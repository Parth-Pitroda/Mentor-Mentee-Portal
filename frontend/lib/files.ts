const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export function getFileViewUrl(fileId: string) {
  return `${API_URL}/storage/files/${encodeURIComponent(fileId)}/view`;
}
