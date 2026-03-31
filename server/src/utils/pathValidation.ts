import path from 'path'

/**
 * Validates and resolves a filename extracted from a URL, ensuring it's safe
 * and contained within the expected directory.
 *
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
export function resolveImagePath(filename: string | undefined, baseDir: string): string | null {
  if (!filename) return null

  // Reject filenames with path separators, null bytes, or traversal patterns
  if (
    filename.includes('/') ||
    filename.includes('\\') ||
    filename.includes('\0') ||
    filename.includes('..')
  ) {
    return null
  }

  // Resolve the full path and verify it's within the expected directory
  const resolved = path.resolve(baseDir, filename)
  const normalizedBase = path.resolve(baseDir)

  if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
    return null
  }

  return resolved
}

/**
 * Extracts a filename from a URL path and resolves it safely against a base directory.
 */
export function safeResolveFromUrl(url: string, baseDir: string): string | null {
  const filename = url.split('/').pop()
  return resolveImagePath(filename, baseDir)
}
