import { readdirSync, statSync, unlinkSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FILE_RETENTION_HOURS = parseInt(process.env.FILE_RETENTION_HOURS || '24', 10)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const MAX_STORED_FILES = parseInt(process.env.MAX_STORED_FILES || '500', 10)

function cleanDirectory(dirPath: string, dirName: string) {
  try {
    const files = readdirSync(dirPath)
    const now = Date.now()
    const maxAge = FILE_RETENTION_HOURS * 60 * 60 * 1000
    let deletedCount = 0

    for (const file of files) {
      if (file === '.gitkeep') continue

      const filePath = path.join(dirPath, file)
      try {
        const stat = statSync(filePath)
        if (now - stat.mtimeMs > maxAge) {
          unlinkSync(filePath)
          deletedCount++
        }
      } catch {
        // Skip files that can't be stat'd or deleted
      }
    }

    if (deletedCount > 0) {
      logger.info({ dir: dirName, deleted: deletedCount }, `[FileCleanup] Cleaned ${deletedCount} old files from ${dirName}`)
    }
  } catch (err) {
    logger.error({ err, dir: dirName }, `[FileCleanup] Error cleaning ${dirName}`)
  }
}

function runCleanup() {
  const editedDir = path.join(__dirname, '..', '..', 'edited')
  const layersDir = path.join(__dirname, '..', '..', 'layers')

  cleanDirectory(editedDir, 'edited')
  cleanDirectory(layersDir, 'layers')
}

export function getFileCount(dirPath: string): number {
  try {
    return readdirSync(dirPath).filter(f => f !== '.gitkeep').length
  } catch {
    return 0
  }
}

export function isStorageFull(dirPath: string): boolean {
  return getFileCount(dirPath) >= MAX_STORED_FILES
}

export function startFileCleanup() {
  // Run on startup
  runCleanup()

  // Run periodically
  setInterval(runCleanup, CLEANUP_INTERVAL_MS)
  logger.info({ retentionHours: FILE_RETENTION_HOURS, maxFiles: MAX_STORED_FILES }, '[FileCleanup] Started cleanup scheduler')
}
