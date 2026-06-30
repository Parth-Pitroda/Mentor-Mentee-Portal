export function getFileViewUrl(fileId: string) {
  return `/api/files/${encodeURIComponent(fileId)}`;
}

export function getFileDownloadUrl(fileId: string) {
  return `/api/files/${encodeURIComponent(fileId)}?download=1`;
}
