<<<<<<< HEAD
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function getFileViewUrl(fileId: string) {
  return `${BASE_URL}/storage/files/${encodeURIComponent(fileId)}/view`;
}

export function getFileDownloadUrl(fileId: string) {
  return `${BASE_URL}/storage/files/${encodeURIComponent(fileId)}/view?download=1`;
=======
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export function getFileViewUrl(fileId: string) {
  return `${API_URL}/storage/files/${encodeURIComponent(fileId)}/view`;
}

export function getFileDownloadUrl(fileId: string) {
  return `${API_URL}/storage/files/${encodeURIComponent(fileId)}/view?download=1`;
>>>>>>> 275ec51c01a9c2e033943010417b52d7032a50c8
}
