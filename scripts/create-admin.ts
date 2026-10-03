/**
 * scripts/create-admin.ts
 *
 * Interactive CLI script to create or update an administrator in Turso / SQLite.
 *
 * Security requirements:
 * 1. Prompts for email and hidden password interactively (and asks for confirmation).
 * 2. Never accepts the password as a command-line argument.
 * 3. Never prints or logs the plain password string.
 * 4. Works against whatever DATABASE_URL and DATABASE_AUTH_TOKEN are set in environment.
 * 5. Computes PBKDF2-SHA-512 hash with a random 32-byte salt and stores only the hash.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 */

import readline from 'node:readline'
import { generateSalt, hashPassword, PBKDF2_ITERATIONS } from '../lib/auth'
import { getRawLibSqlClient, runMigrations } from '../lib/db'

function ask(question: string, hidden = false): Promise<string> {
  const isTTY = Boolean(process.stdin.isTTY && typeof process.stdin.setRawMode === 'function')

  if (!hidden || !isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }

  // TTY raw mode: mask characters for hidden password input
  return new Promise((resolve) => {
    process.stdout.write(question)
    let input = ''
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const onData = (char: string) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        console.log('')
        resolve(input.trim())
      } else if (char === '\u0003') {
        // Ctrl+C
        process.stdin.setRawMode(false)
        console.log('\nOperation cancelled.')
        process.exit(1)
      } else if (char === '\b' || char === '\u007f' || char === '\x08') {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        input += char
        process.stdout.write('*')
      }
    }

    process.stdin.on('data', onData)
  })
}

async function main() {
  if (process.argv.length > 2) {
    console.log('[Notice] For security reasons, create-admin.ts ignores all command-line arguments and requires interactive prompts.')
  }

  console.log('=== Falcon 3D Prints — Create Admin User ===')
  const dbUrl = process.env.DATABASE_URL || 'file:local.db'
  const isRemoteTurso = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')
  console.log(`Database Target: ${isRemoteTurso ? dbUrl.replace(/(:\/\/[^@]*@)/, '://***@') : dbUrl}\n`)

  const client = getRawLibSqlClient()
  await runMigrations(client)

  const email = await ask('Admin Email: ')
  if (!email || !email.includes('@')) {
    console.error('Error: Please enter a valid email address.')
    process.exit(1)
  }

  const password = await ask('Admin Password (min 8 chars): ', true)
  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.')
    process.exit(1)
  }

  const confirm = await ask('Confirm Password: ', true)
  if (password !== confirm) {
    console.error('Error: Passwords do not match.')
    process.exit(1)
  }

  console.log('\nComputing PBKDF2-SHA-512 hash with random salt...')
  const salt = generateSalt(32)
  const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS)
  const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const sql = `
    INSERT INTO users (id, email, password_hash, password_salt, pbkdf2_iters, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      password_salt = excluded.password_salt,
      pbkdf2_iters = excluded.pbkdf2_iters,
      is_active = 1,
      updated_at = unixepoch();
  `

  console.log(`Registering admin account in database...`)
  try {
    await client.execute({
      sql,
      args: [userId, email.toLowerCase(), hash, salt, PBKDF2_ITERATIONS],
    })
    console.log(`\n✅ Successfully created / updated admin account: ${email}`)
    console.log(`Account ID: ${userId}`)
    console.log('Credentials stored as salted cryptographic hash. No secrets written to disk.')
  } catch (err: any) {
    console.error('Failed to create admin user:', err.message)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
