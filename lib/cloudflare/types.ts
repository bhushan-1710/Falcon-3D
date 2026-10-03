/**
 * Cloudflare Worker / D1 / R2 Type Definitions
 * Zero-dependency native types matching Cloudflare Workers runtime APIs.
 */

export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: {
    duration?: number
    changes?: number
    last_row_id?: number
    served_by?: string
    [key: string]: unknown
  }
  error?: string
}

export interface D1ExecResult {
  count: number
  duration: number
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export interface R2UploadedPart {
  partNumber: number
  etag: string
}

export interface R2MultipartUpload {
  key: string
  uploadId: string
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | ArrayBufferView | Blob | string): Promise<R2UploadedPart>
  abort(): Promise<void>
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>
}

export interface R2Object {
  key: string
  version: string
  size: number
  etag: string
  httpEtag: string
  checksums: unknown
  uploaded: Date
  httpMetadata?: {
    contentType?: string
    contentLanguage?: string
    contentDisposition?: string
    contentEncoding?: string
    cacheControl?: string
    cacheExpiry?: Date
  }
  customMetadata?: Record<string, string>
  writeHttpMetadata?(headers: Headers): void
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream
  bodyUsed: boolean
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

export interface R2GetOptions {
  onlyIf?: Headers | { etagMatches?: string; etagDoesNotMatch?: string; uploadedBefore?: Date; uploadedAfter?: Date }
  range?: { offset?: number; length?: number; suffix?: number }
}

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string
    contentLanguage?: string
    contentDisposition?: string
    contentEncoding?: string
    cacheControl?: string
    cacheExpiry?: Date
  }
  customMetadata?: Record<string, string>
  sha1?: ArrayBuffer | string
  sha256?: ArrayBuffer | string
}

export interface R2Bucket {
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | Blob | string | null,
    options?: R2PutOptions
  ): Promise<R2Object | null>
  delete(keys: string | string[]): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string; delimiter?: string }): Promise<{
    objects: R2Object[]
    truncated: boolean
    cursor?: string
    delimitedPrefixes: string[]
  }>
  createMultipartUpload(key: string, options?: R2PutOptions): Promise<R2MultipartUpload>
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload
}

declare global {
  interface CloudflareEnv {
    DB?: D1Database
    MEDIA_BUCKET?: R2Bucket
  }
}
