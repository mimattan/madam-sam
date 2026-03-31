import { describe, it, expect } from 'vitest'
import path from 'path'
import { resolveImagePath, safeResolveFromUrl } from '../pathValidation.js'

describe('resolveImagePath', () => {
  const baseDir = '/app/server/edited'

  it('resolves a valid filename', () => {
    const result = resolveImagePath('abc-123.png', baseDir)
    expect(result).toBe(path.resolve(baseDir, 'abc-123.png'))
  })

  it('resolves a UUID filename', () => {
    const result = resolveImagePath('550e8400-e29b-41d4-a716-446655440000.png', baseDir)
    expect(result).toBe(path.resolve(baseDir, '550e8400-e29b-41d4-a716-446655440000.png'))
  })

  it('rejects undefined filename', () => {
    expect(resolveImagePath(undefined, baseDir)).toBeNull()
  })

  it('rejects filename with forward slash', () => {
    expect(resolveImagePath('../etc/passwd', baseDir)).toBeNull()
  })

  it('rejects filename with backslash', () => {
    expect(resolveImagePath('..\\etc\\passwd', baseDir)).toBeNull()
  })

  it('rejects filename with double dots', () => {
    expect(resolveImagePath('..', baseDir)).toBeNull()
  })

  it('rejects filename with null bytes', () => {
    expect(resolveImagePath('file\0.png', baseDir)).toBeNull()
  })

  it('rejects path traversal attempt', () => {
    expect(resolveImagePath('../../etc/passwd', baseDir)).toBeNull()
  })

  it('rejects encoded path traversal', () => {
    // The actual characters after decoding
    expect(resolveImagePath('../secret.txt', baseDir)).toBeNull()
  })
})

describe('safeResolveFromUrl', () => {
  const baseDir = '/app/server/edited'

  it('extracts filename from URL path', () => {
    const result = safeResolveFromUrl('/api/images/edited/abc.png', baseDir)
    expect(result).toBe(path.resolve(baseDir, 'abc.png'))
  })

  it('extracts filename from full URL', () => {
    const result = safeResolveFromUrl('http://localhost:3000/api/images/edited/abc.png', baseDir)
    expect(result).toBe(path.resolve(baseDir, 'abc.png'))
  })

  it('safely extracts only the final filename segment from traversal attempts', () => {
    // split('/').pop() extracts "passwd" which is a safe filename (no traversal)
    const result = safeResolveFromUrl('/api/images/edited/../../etc/passwd', baseDir)
    expect(result).toBe(path.resolve(baseDir, 'passwd'))
  })

  it('rejects URL where filename itself contains traversal', () => {
    expect(safeResolveFromUrl('/api/images/edited/..%2F..%2Fetc%2Fpasswd', baseDir)).toBeNull()
  })

  it('rejects empty URL', () => {
    expect(safeResolveFromUrl('', baseDir)).toBeNull()
  })
})
