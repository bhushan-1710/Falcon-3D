import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

/**
 * Build check: Ensures secrets (especially SUPABASE_SERVICE_ROLE_KEY)
 * never leak into client bundles or the git repository.
 */
function checkSecrets() {
  console.log('[CHECK-SECRETS] Running build secret verification...')
  let violations: string[] = []

  // 1. Check Git tracked files for .env files or leaked secrets
  try {
    const gitTracked = execSync('git ls-files', { encoding: 'utf-8' }).split('\n')
    const badTracked = gitTracked.filter(f => f.startsWith('.env') && f !== '.env.example')
    if (badTracked.length > 0) {
      violations.push(`Git is tracking sensitive env files: ${badTracked.join(', ')}`)
    }
  } catch (e: any) {
    console.warn('[CHECK-SECRETS] Git ls-files check skipped:', e.message)
  }

  // 2. Scan .next/static/ client bundles
  const staticDir = path.join(process.cwd(), '.next', 'static')
  if (fs.existsSync(staticDir)) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    const forbiddenPatterns: { name: string; test: (content: string) => boolean }[] = [
      {
        name: 'SUPABASE_SERVICE_ROLE_KEY env name',
        test: (c) => c.includes('SUPABASE_SERVICE_ROLE_KEY'),
      },
      {
        name: 'service_role key identifier',
        test: (c) => c.includes('"service_role"') || c.includes("'service_role'"),
      },
    ]

    if (serviceKey && serviceKey.length > 10) {
      forbiddenPatterns.push({
        name: 'Live SUPABASE_SERVICE_ROLE_KEY secret value',
        test: (c) => c.includes(serviceKey),
      })
    }

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanDir(fullPath)
        } else if (entry.name.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          for (const pattern of forbiddenPatterns) {
            if (pattern.test(content)) {
              violations.push(
                `Secret violation: ${pattern.name} found in client bundle: ${path.relative(process.cwd(), fullPath)}`
              )
            }
          }
        }
      }
    }

    scanDir(staticDir)
  } else {
    console.log('[CHECK-SECRETS] .next/static not found (run after next build). Scanning client source code...')
    // Scan client components in app/ and components/ for direct references to process.env.SUPABASE_SERVICE_ROLE_KEY
    const clientDirs = [path.join(process.cwd(), 'app'), path.join(process.cwd(), 'components')]
    for (const cDir of clientDirs) {
      if (fs.existsSync(cDir)) {
        function scanSrc(dir: string) {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              scanSrc(fullPath)
            } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
              const content = fs.readFileSync(fullPath, 'utf-8')
              if (content.includes("'use client'") || content.includes('"use client"')) {
                if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
                  violations.push(
                    `Secret violation: SUPABASE_SERVICE_ROLE_KEY referenced in 'use client' file: ${path.relative(process.cwd(), fullPath)}`
                  )
                }
              }
            }
          }
        }
        scanSrc(cDir)
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n[CHECK-SECRETS] ❌ FAILED! Secret leak detected:')
    for (const v of violations) {
      console.error(` - ${v}`)
    }
    process.exit(1)
  }

  console.log('[CHECK-SECRETS] ✅ PASS: No secret leaks detected in client bundles or repository.')
}

checkSecrets()
