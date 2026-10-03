/**
 * Media Usage Coverage Test
 * Verifies that checkMediaUsage covers:
 * 1. categories.image_id
 * 2. projects.featured_image_id
 * 3. projects.og_image_id
 * 4. project_media.media_id (join table)
 * 5. products.featured_image_id
 * 6. products.og_image_id
 * 7. product_media.media_id (join table)
 * 8. videos.thumbnail_id
 * 9. website_content.content_json
 */

import assert from 'node:assert'
import { checkMediaUsage } from '../lib/media/usage'
import * as context from '../lib/cloudflare/context'

// Mock D1 Database simulating all required tables
function createMockDB(testMediaId: string) {
  return {
    prepare(query: string) {
      let boundArgs: any[] = []
      return {
        bind(...args: any[]) {
          boundArgs = args
          return this
        },
        async all<T = any>() {
          const results: any[] = []

          // 1. categories.image_id
          if (query.includes('FROM categories') && boundArgs[0] === testMediaId) {
            results.push({ id: 'cat-1', name: 'Test Category' })
          }

          // 2. projects
          if (query.includes('FROM projects WHERE featured_image_id = ? OR og_image_id = ?')) {
            if (boundArgs[0] === testMediaId || boundArgs[1] === testMediaId) {
              results.push({
                id: 'proj-1',
                title: 'Test Project',
                featured_image_id: testMediaId,
                og_image_id: testMediaId,
              })
            }
          }

          // 3. project_media
          if (query.includes('FROM project_media') && boundArgs[0] === testMediaId) {
            results.push({ id: 'proj-1', title: 'Test Project' })
          }

          // 4. products
          if (query.includes('FROM products WHERE featured_image_id = ? OR og_image_id = ?')) {
            if (boundArgs[0] === testMediaId || boundArgs[1] === testMediaId) {
              results.push({
                id: 'prod-1',
                title: 'Test Product',
                featured_image_id: testMediaId,
                og_image_id: testMediaId,
              })
            }
          }

          // 5. product_media
          if (query.includes('FROM product_media') && boundArgs[0] === testMediaId) {
            results.push({ id: 'prod-1', title: 'Test Product' })
          }

          // 6. videos.thumbnail_id
          if (query.includes('FROM videos WHERE thumbnail_id = ?') && boundArgs[0] === testMediaId) {
            results.push({ id: 'vid-1', title: 'Test Video' })
          }

          // 7. website_content
          if (query.includes('FROM website_content')) {
            results.push({
              section_key: 'hero',
              content_json: JSON.stringify({ heroImageId: testMediaId }),
            })
          }

          return { results: results as T[], success: true, meta: {} }
        },
        async first<T = any>() {
          const res = await this.all<T>()
          return res.results[0] || null
        },
        async run() {
          return { results: [], success: true, meta: {} }
        },
        raw: async () => [],
      }
    },
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  }
}

async function runTest() {
  console.log('--- Running Media Usage Test ---')
  const testMediaId = 'med_test_123456789'
  const mockDB = createMockDB(testMediaId)

  const result = await checkMediaUsage(testMediaId, mockDB)

  console.log('Total references found:', result.totalReferences)
  console.log('Found fields:', result.references.map((r) => `${r.type} (${r.field})`))

  // Assertions for all 9 required reference locations:
  const fields = result.references.map((r) => r.field)

  assert.ok(fields.includes('image_id'), 'Must check categories.image_id')
  assert.ok(fields.includes('featured_image_id'), 'Must check projects/products.featured_image_id')
  assert.ok(fields.includes('og_image_id'), 'Must check projects/products.og_image_id')
  assert.ok(fields.includes('project_media.media_id'), 'Must check project_media join table')
  assert.ok(fields.includes('product_media.media_id'), 'Must check product_media join table')
  assert.ok(fields.includes('thumbnail_id'), 'Must check videos.thumbnail_id')
  assert.ok(fields.includes('content_json'), 'Must check website_content.content_json')

  assert.strictEqual(result.inUse, true, 'Media should be marked inUse')
  assert.ok(result.totalReferences >= 8, 'Expected at least 8 distinct references')

  console.log(' All media usage assertions passed successfully!')
}

runTest().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
