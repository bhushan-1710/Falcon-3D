/**
 * Media Validation Unit Test
 * Tests:
 * 1. Valid magic bytes for JPEG, PNG, WebP, AVIF
 * 2. Rejection of SVG files (strict security rule: no SVG)
 * 3. Rejection of mismatched MIME vs magic bytes
 * 4. Size limit enforcement
 */

import assert from 'node:assert'
import { validateImageUpload, verifyImageMagicBytes } from '../lib/media/validation'

function runValidationTests() {
  console.log('--- Running Media Validation Tests ---')

  // 1. JPEG: FF D8 FF
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
  const jpegRes = validateImageUpload(jpegHeader, 'image/jpeg', jpegHeader.length)
  assert.strictEqual(jpegRes.valid, true, 'JPEG should be valid')
  assert.strictEqual(jpegRes.detectedMime, 'image/jpeg')

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
  const pngRes = validateImageUpload(pngHeader, 'image/png', pngHeader.length)
  assert.strictEqual(pngRes.valid, true, 'PNG should be valid')
  assert.strictEqual(pngRes.detectedMime, 'image/png')

  // 3. WebP: RIFF ... WEBP
  const webpHeader = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x20, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50, // WEBP
  ])
  const webpRes = validateImageUpload(webpHeader, 'image/webp', webpHeader.length)
  assert.strictEqual(webpRes.valid, true, 'WebP should be valid')
  assert.strictEqual(webpRes.detectedMime, 'image/webp')

  // 4. AVIF: offset 4 ftyp, offset 8 avif
  const avifHeader = new Uint8Array([
    0x00, 0x00, 0x00, 0x1c,
    0x66, 0x74, 0x79, 0x70, // ftyp
    0x61, 0x76, 0x69, 0x66, // avif
  ])
  const avifRes = validateImageUpload(avifHeader, 'image/avif', avifHeader.length)
  assert.strictEqual(avifRes.valid, true, 'AVIF should be valid')
  assert.strictEqual(avifRes.detectedMime, 'image/avif')

  // 5. SVG Rejection (Security check)
  const svgText = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>')
  const svgRes = validateImageUpload(svgText, 'image/svg+xml', svgText.length)
  assert.strictEqual(svgRes.valid, false, 'SVG should be rejected')
  assert.ok(svgRes.error?.includes('disallowed') || svgRes.error?.includes('allowed list'))

  // 6. Spoofed extension: Text file declared as image/png
  const fakePng = new TextEncoder().encode('Hello this is a plain text file pretending to be PNG')
  const spoofRes = validateImageUpload(fakePng, 'image/png', fakePng.length)
  assert.strictEqual(spoofRes.valid, false, 'Spoofed file should be rejected')

  // 7. MIME mismatch: JPEG bytes declared as image/png
  const mismatchRes = validateImageUpload(jpegHeader, 'image/png', jpegHeader.length)
  assert.strictEqual(mismatchRes.valid, false, 'Mismatched MIME should be rejected')
  assert.ok(mismatchRes.error?.includes('mismatch'))

  // 8. Size limit check
  const largeRes = validateImageUpload(jpegHeader, 'image/jpeg', 20 * 1024 * 1024)
  assert.strictEqual(largeRes.valid, false, 'Over-sized image should be rejected')
  assert.ok(largeRes.error?.includes('maximum allowed limit'))

  console.log(' All media validation assertions passed successfully!')
}

runValidationTests()
