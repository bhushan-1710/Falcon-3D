import fs from 'fs'
import path from 'path'

export interface StorageConfig {
  supabaseUrl: string | null
  serviceRoleKey: string | null
  bucket: string
  isConfigured: boolean
}

export function getStorageConfig(): StorageConfig {
  const url = process.env.SUPABASE_URL?.trim() || null
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'falcon-media'

  return {
    supabaseUrl: url ? url.replace(/\/+$/, '') : null,
    serviceRoleKey: key,
    bucket,
    isConfigured: Boolean(url && key && !url.includes('placeholder')),
  }
}

/**
 * Return public URL for a storage path in Supabase Storage.
 */
export function getPublicUrl(storagePath: string): string {
  const { supabaseUrl, bucket, isConfigured } = getStorageConfig()
  const cleanPath = storagePath.replace(/^\/+/, '')

  if (isConfigured && supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
  }

  // Fallback to internal media serving route for local development
  return `/api/media/${cleanPath}`
}

/**
 * Upload an object to Supabase Storage via REST API (plain fetch).
 */
export async function putObject(
  storagePath: string,
  data: Buffer | Uint8Array,
  mimeType: string
): Promise<{ success: boolean; path: string; publicUrl: string; error?: string }> {
  const config = getStorageConfig()
  const cleanPath = storagePath.replace(/^\/+/, '')

  if (config.isConfigured && config.supabaseUrl && config.serviceRoleKey) {
    try {
      const url = `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${cleanPath}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.serviceRoleKey}`,
          'apikey': config.serviceRoleKey,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: data as unknown as BodyInit,
      })

      if (!res.ok) {
        const errText = await res.text()
        return {
          success: false,
          path: cleanPath,
          publicUrl: getPublicUrl(cleanPath),
          error: `Supabase upload failed (${res.status}): ${errText}`,
        }
      }

      return {
        success: true,
        path: cleanPath,
        publicUrl: getPublicUrl(cleanPath),
      }
    } catch (err: any) {
      return {
        success: false,
        path: cleanPath,
        publicUrl: getPublicUrl(cleanPath),
        error: err.message || 'Supabase upload network error',
      }
    }
  }

  // Local development file fallback
  try {
    const localDir = path.join(process.cwd(), '.storage', config.bucket)
    const filePath = path.join(localDir, ...cleanPath.split('/'))
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, Buffer.from(data))

    return {
      success: true,
      path: cleanPath,
      publicUrl: getPublicUrl(cleanPath),
    }
  } catch (err: any) {
    return {
      success: false,
      path: cleanPath,
      publicUrl: getPublicUrl(cleanPath),
      error: err.message || 'Local storage write error',
    }
  }
}

/**
 * Delete an object from Supabase Storage via REST API (plain fetch).
 */
export async function deleteObject(storagePath: string): Promise<{ success: boolean; error?: string }> {
  const config = getStorageConfig()
  const cleanPath = storagePath.replace(/^\/+/, '')

  if (config.isConfigured && config.supabaseUrl && config.serviceRoleKey) {
    try {
      const url = `${config.supabaseUrl}/storage/v1/object/${config.bucket}`
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.serviceRoleKey}`,
          'apikey': config.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: [cleanPath] }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return { success: false, error: `Supabase delete failed (${res.status}): ${errText}` }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase delete network error' }
    }
  }

  // Local development file deletion
  try {
    const localDir = path.join(process.cwd(), '.storage', config.bucket)
    const filePath = path.join(localDir, ...cleanPath.split('/'))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Issue a signed upload URL for direct browser-to-Supabase uploads.
 * Used for video files or assets exceeding Vercel's ~4.5 MB request limit.
 */
export async function createSignedUploadUrl(
  storagePath: string,
  expiresInSec: number = 3600
): Promise<{ success: boolean; signedUrl: string; token?: string; publicUrl: string; error?: string }> {
  const config = getStorageConfig()
  const cleanPath = storagePath.replace(/^\/+/, '')
  const publicUrl = getPublicUrl(cleanPath)

  if (config.isConfigured && config.supabaseUrl && config.serviceRoleKey) {
    try {
      const url = `${config.supabaseUrl}/storage/v1/object/upload/sign/${config.bucket}/${cleanPath}`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.serviceRoleKey}`,
          'apikey': config.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: expiresInSec }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return { success: false, signedUrl: '', publicUrl, error: `Signed URL request failed: ${errText}` }
      }

      const data = await res.json()
      // Supabase returns relative or absolute url: e.g. { url: "/storage/v1/..." }
      let signedUrl = data.url || ''
      if (signedUrl.startsWith('/')) {
        signedUrl = `${config.supabaseUrl}${signedUrl}`
      }

      return {
        success: true,
        signedUrl,
        token: data.token,
        publicUrl,
      }
    } catch (err: any) {
      return { success: false, signedUrl: '', publicUrl, error: err.message }
    }
  }

  // Mock / simulation fallback for local development when Supabase credentials are not set
  return {
    success: true,
    signedUrl: `/api/admin/media/mock-direct-upload?path=${encodeURIComponent(cleanPath)}`,
    publicUrl,
  }
}

/**
 * Lightweight ping for Keep-Alive cron job to prevent free Supabase project pausing.
 */
export async function pingSupabaseStorage(): Promise<{ success: boolean; status: number; message: string }> {
  const config = getStorageConfig()

  if (!config.isConfigured || !config.supabaseUrl || !config.serviceRoleKey) {
    return {
      success: true,
      status: 200,
      message: 'Supabase credentials not configured in environment (local dev mode)',
    }
  }

  try {
    const url = `${config.supabaseUrl}/storage/v1/object/list/${config.bucket}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.serviceRoleKey}`,
        'apikey': config.serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 1 }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, status: res.status, message: `Storage ping failed: ${text}` }
    }

    return { success: true, status: 200, message: 'Supabase Storage is active' }
  } catch (err: any) {
    return { success: false, status: 500, message: err.message || 'Ping failed' }
  }
}

/**
 * Verify a stored object's type/magic bytes after upload.
 * If verification fails, the stored object is deleted immediately.
 */
export async function verifyStoredObject(
  storagePath: string,
  isVideo: boolean = false
): Promise<{ valid: boolean; error?: string }> {
  const { verifyAnyMediaBytes } = await import('@/lib/media/validation')
  const config = getStorageConfig()
  const cleanPath = storagePath.replace(/^\/+/, '')

  let buffer: Uint8Array | null = null

  if (config.isConfigured && config.supabaseUrl && config.serviceRoleKey) {
    try {
      const url = `${config.supabaseUrl}/storage/v1/object/authenticated/${config.bucket}/${cleanPath}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.serviceRoleKey}`,
          'apikey': config.serviceRoleKey,
          'Range': 'bytes=0-511',
        },
      })
      if (!res.ok) {
        // Fallback to full fetch if Range not supported
        const fullRes = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${config.serviceRoleKey}`,
            'apikey': config.serviceRoleKey,
          },
        })
        if (!fullRes.ok) {
          return { valid: false, error: `Could not retrieve stored object for verification (${res.status})` }
        }
        buffer = new Uint8Array(await fullRes.arrayBuffer())
      } else {
        buffer = new Uint8Array(await res.arrayBuffer())
      }
    } catch (err: any) {
      return { valid: false, error: err.message || 'Network error verifying stored object' }
    }
  } else {
    // Local storage
    try {
      const localDir = path.join(process.cwd(), '.storage', config.bucket)
      const filePath = path.join(localDir, ...cleanPath.split('/'))
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'Stored file not found on disk' }
      }
      const fd = fs.openSync(filePath, 'r')
      const buf = Buffer.alloc(512)
      const bytesRead = fs.readSync(fd, buf, 0, 512, 0)
      fs.closeSync(fd)
      buffer = new Uint8Array(buf.subarray(0, bytesRead))
    } catch (err: any) {
      return { valid: false, error: err.message }
    }
  }

  if (!buffer || buffer.length === 0) {
    await deleteObject(storagePath)
    return { valid: false, error: 'Stored object is empty or unreadable' }
  }

  const check = verifyAnyMediaBytes(buffer, isVideo)
  if (!check.valid) {
    // Immediately delete the invalid object!
    await deleteObject(storagePath)
    return { valid: false, error: check.error || 'Stored object failed validation check' }
  }

  return { valid: true }
}
