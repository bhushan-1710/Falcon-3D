/**
 * Browser-side image resizing & upload pipeline
 * Respects Vercel's ~4.5 MB request limit:
 * - Images resized in the browser (full + 320px thumbnail)
 * - Files <= 4 MB upload via authenticated /api/admin/media/upload
 * - Larger files (or videos up to 50 MB) upload directly to Supabase via signed upload URL
 */

export const MAX_SUPABASE_FREE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
export const PROXIED_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024 // 4 MB (under Vercel's 4.5 MB limit)

export interface ResizeResult {
  fullBlob: Blob
  thumbnailBlob: Blob
  width: number
  height: number
  fullFile: File
}

/**
 * Resize an image file in the browser canvas.
 * Produces full version (max 2560px) and a 320px thumbnail.
 */
export async function resizeImageInBrowser(file: File): Promise<ResizeResult> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g. video), bypass canvas
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'))
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const origWidth = img.naturalWidth || img.width
      const origHeight = img.naturalHeight || img.height

      // 1. Full Image Resize (max 2560px)
      const maxFull = 2560
      let fullW = origWidth
      let fullH = origHeight
      if (origWidth > maxFull || origHeight > maxFull) {
        if (origWidth > origHeight) {
          fullW = maxFull
          fullH = Math.round((origHeight * maxFull) / origWidth)
        } else {
          fullH = maxFull
          fullW = Math.round((origWidth * maxFull) / origHeight)
        }
      }

      const canvasFull = document.createElement('canvas')
      canvasFull.width = fullW
      canvasFull.height = fullH
      const ctxFull = canvasFull.getContext('2d')
      if (!ctxFull) return reject(new Error('Canvas 2D context unavailable'))
      ctxFull.drawImage(img, 0, 0, fullW, fullH)

      // 2. Thumbnail Resize (max 320px)
      const maxThumb = 320
      let thumbW = origWidth
      let thumbH = origHeight
      if (origWidth > origHeight) {
        thumbW = maxThumb
        thumbH = Math.round((origHeight * maxThumb) / origWidth)
      } else {
        thumbH = maxThumb
        thumbW = Math.round((origWidth * maxThumb) / origHeight)
      }

      const canvasThumb = document.createElement('canvas')
      canvasThumb.width = thumbW
      canvasThumb.height = thumbH
      const ctxThumb = canvasThumb.getContext('2d')
      if (!ctxThumb) return reject(new Error('Canvas 2D context unavailable'))
      ctxThumb.drawImage(img, 0, 0, thumbW, thumbH)

      const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = 0.90

      canvasFull.toBlob((fullBlob) => {
        if (!fullBlob) return reject(new Error('Full canvas toBlob failed'))
        canvasThumb.toBlob((thumbBlob) => {
          if (!thumbBlob) return reject(new Error('Thumb canvas toBlob failed'))
          
          const fullFile = new File([fullBlob], file.name, {
            type: outputMime,
            lastModified: Date.now(),
          })

          resolve({
            fullBlob,
            thumbnailBlob: thumbBlob,
            width: fullW,
            height: fullH,
            fullFile,
          })
        }, 'image/jpeg', 0.85)
      }, outputMime, quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image into browser for resizing'))
    }

    img.src = url
  })
}

export interface UploadOptions {
  isVideo?: boolean
  title?: string
  altText?: string
  onProgress?: (progress: number) => void
}

/**
 * Unified media upload handler:
 * - Rejects files exceeding 50 MB
 * - Resizes images in browser
 * - Sends via /api/admin/media/upload if under 4 MB
 * - Uses direct signed upload if > 4 MB or if video
 */
export async function uploadMediaWithLimits(
  file: File,
  options: UploadOptions = {}
): Promise<{ success: boolean; data?: any; error?: string }> {
  // 1. Max size check for free plan
  if (file.size > MAX_SUPABASE_FREE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB limit for the Supabase free tier.`,
    }
  }

  // 2. Strict SVG check
  if (file.type.toLowerCase().includes('svg') || file.name.toLowerCase().endsWith('.svg')) {
    return {
      success: false,
      error: 'SVG uploads are strictly disallowed for security reasons.',
    }
  }

  let uploadFile = file
  let imgWidth: number | undefined
  let imgHeight: number | undefined

  // Resize images in browser
  if (file.type.startsWith('image/')) {
    try {
      const resized = await resizeImageInBrowser(file)
      uploadFile = resized.fullFile
      imgWidth = resized.width
      imgHeight = resized.height
    } catch (e) {
      console.warn('Browser image resizing failed, proceeding with original file:', e)
    }
  }

  // If under limit and not a video, use standard server-proxied route
  if (!options.isVideo && uploadFile.size <= PROXIED_UPLOAD_LIMIT_BYTES) {
    const formData = new FormData()
    formData.append('file', uploadFile)
    if (options.altText) formData.append('alt_text', options.altText)
    if (imgWidth) formData.append('width', String(imgWidth))
    if (imgHeight) formData.append('height', String(imgHeight))

    const res = await fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Server upload failed' }
    }
    return { success: true, data: data.media }
  }

  // Direct signed upload (for videos or large files > 4 MB)
  try {
    // Step A: Request signed upload URL from authenticated endpoint
    const signRes = await fetch('/api/admin/media/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: uploadFile.name,
        mime_type: uploadFile.type || (options.isVideo ? 'video/mp4' : 'application/octet-stream'),
        size_bytes: uploadFile.size,
        is_video: Boolean(options.isVideo),
      }),
    })

    const signData = await signRes.json()
    if (!signRes.ok || !signData.signedUrl) {
      return { success: false, error: signData.error || 'Failed to obtain signed upload URL' }
    }

    // Step B: Upload DIRECTLY to Supabase (bypassing Vercel's serverless function body limit)
    const directUploadRes = await fetch(signData.signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': uploadFile.type || 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
      body: uploadFile,
    })

    if (!directUploadRes.ok) {
      const errText = await directUploadRes.text()
      return { success: false, error: `Direct upload to storage failed (${directUploadRes.status}): ${errText}` }
    }

    // Step C: Complete upload on server (verifies magic bytes of stored object and records in DB)
    const completeRes = await fetch('/api/admin/media/complete-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: signData.id,
        storagePath: signData.storagePath,
        filename: uploadFile.name,
        mime_type: uploadFile.type || (options.isVideo ? 'video/mp4' : 'application/octet-stream'),
        size_bytes: uploadFile.size,
        width: imgWidth,
        height: imgHeight,
        alt_text: options.altText,
        title: options.title,
        is_video: Boolean(options.isVideo),
      }),
    })

    const completeData = await completeRes.json()
    if (!completeRes.ok) {
      return { success: false, error: completeData.error || 'Failed to complete upload' }
    }

    return {
      success: true,
      data: options.isVideo ? completeData.video : completeData.media,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Direct upload network failure' }
  }
}
