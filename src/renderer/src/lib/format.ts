const KB = 1024
const MB = KB * KB
const GB = MB * KB

/** Convert an absolute file-system path to an app://images/ URL for use as img src. */
export function fileUrl(path: string): string {
  return `app://images${path}`
}

export function formatBytes(bytes: number): string {
  if (bytes < KB) {
    return `${bytes} B`
  }

  if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`
  }

  if (bytes < GB) {
    return `${(bytes / MB).toFixed(1)} MB`
  }

  return `${(bytes / GB).toFixed(2)} GB`
}
