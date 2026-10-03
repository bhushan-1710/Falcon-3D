/**
 * Image Validation with Magic Byte Verification
 * Enforces strict MIME allowlist, size limits, and header byte signatures.
 * Explicitly rejects SVG and unverified files.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB
export const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024 // 250 MB

export interface ValidationResult {
  valid: boolean
  error?: string
  detectedMime?: AllowedImageMimeType
}

/**
 * Verify buffer contents against known image magic numbers.
 */
export function verifyImageMagicBytes(buffer: Uint8Array): ValidationResult {
  if (buffer.length < 12) {
    return { valid: false, error: 'File too small to be a valid image' }
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' }
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: 'image/png' }
  }

  // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp' }
  }

  // 4. AVIF: offset 4-7 'ftyp', offset 8-11 'avif' or 'avis'
// 4. AVIF: offset 4-7 'ftyp', offset 8-11 'avif' or 'avis'
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x61 &&
    buffer[9] === 0x76 &&
    buffer[10] === 0x69 &&
    (buffer[11] === 0x66 || buffer[11] === 0x73)
  ) {
    return { valid: true, detectedMime: 'image/avif' }
  }

  // Check for SVG signatures to explicitly reject with a clear error
  const headerText = new TextDecoder('utf-8', { fatal: false })
    .decode(buffer.subarray(0, Math.min(256, buffer.length)))
    .toLowerCase()

  if (headerText.includes('<svg') || headerText.includes('<?xml') || headerText.includes('<html')) {
    return { valid: false, error: 'SVG and script files are strictly disallowed for security reasons' }
  }

  return { valid: false, error: 'File magic bytes do not match any allowed image format (JPEG, PNG, WebP, AVIF)' }
}

/**
 * Verify video buffer against MP4 and WebM magic bytes.
 */
export function verifyVideoMagicBytes(buffer: Uint8Array): { valid: boolean; error?: string; detectedMime?: string } {
  if (buffer.length < 12) {
    return { valid: false, error: 'File too small to be a valid video' }
  }

  // WebM / EBML: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { valid: true, detectedMime: 'video/webm' }
  }

  // MP4 / QuickTime: offset 4-7 is 'ftyp'
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return { valid: true, detectedMime: 'video/mp4' }
  }

  // QuickTime (moov, mdat, wide)
  const tag = String.fromCharCode(buffer[4], buffer[5], buffer[6], buffer[7])
  if (['moov', 'mdat', 'wide'].includes(tag)) {
    return { valid: true, detectedMime: 'video/quicktime' }
  }

  const headerText = new TextDecoder('utf-8', { fatal: false })
    .decode(buffer.subarray(0, Math.min(256, buffer.length)))
    .toLowerCase()

  if (headerText.includes('<svg') || headerText.includes('<?xml')) {
    return { valid: false, error: 'SVG files are strictly disallowed' }
  }

  return { valid: false, error: 'File magic bytes do not match allowed video formats (MP4, WebM)' }
}

/**
 * Verify any stored object bytes (image or video)
 */
export function verifyAnyMediaBytes(buffer: Uint8Array, isVideo: boolean = false): { valid: boolean; error?: string } {
  const headerText = new TextDecoder('utf-8', { fatal: false })
    .decode(buffer.subarray(0, Math.min(256, buffer.length)))
    .toLowerCase()

  if (headerText.includes('<svg') || headerText.includes('<?xml') || headerText.includes('<html')) {
    return { valid: false, error: 'SVG/HTML files are strictly disallowed' }
  }

  if (isVideo) {
    return verifyVideoMagicBytes(buffer)
  }
  return verifyImageMagicBytes(buffer)
}

/**
 * Full server-side validation of image upload
 */
export function validateImageUpload(
  buffer: Uint8Array,
  declaredMimeType: string,
  declaredSize: number
): ValidationResult {
  if (declaredSize > MAX_IMAGE_SIZE_BYTES || buffer.length > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed limit of ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB`,
    }
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(declaredMimeType as AllowedImageMimeType)) {
    return {
      valid: false,
      error: `MIME type '${declaredMimeType}' is not in the allowed list (JPEG, PNG, WebP, AVIF)`,
    }
  }

  const magicCheck = verifyImageMagicBytes(buffer)
  if (!magicCheck.valid) {
    return magicCheck
  }

  if (magicCheck.detectedMime !== declaredMimeType) {
    return {
      valid: false,
      error: `MIME type mismatch: declared '${declaredMimeType}' but magic bytes indicate '${magicCheck.detectedMime}'`,
    }
  }

  return { valid: true, detectedMime: magicCheck.detectedMime }
}
