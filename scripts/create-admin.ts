/**
 * scripts/create-admin.ts
 *
 * Local & production CLI script to create an admin user in Turso / SQLite.
 * Prompts for email and password interactively, generates a random 32-byte salt,
 * computes PBKDF2-SHA-512 hash using WebCrypto, and stores only the hash in the database.
 *
 * Never stores plain passwords in env or repo files.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 */

import readline from 'node:readline'
import { generateSalt, hashPassword, PBKDF2_ITERATIONS } from '../lib/auth'
import { getRawLibSqlClient, runMigrations } from '../lib/db'

function ask(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    } else {
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
          rl.close()
          console.log('')
          resolve(input.trim())
        } else if (char === '\u0003') {
          process.exit(1)
        } else if (char === '\b' || char === '\u007f') {
          if (input.length > 0) {
            input = input.slice(0, -1)
          }
        } else {
          input += char
        }
      }
      process.stdin.on('data', onData)
    }
  })
}

async function main() {
  console.log('=== Falcon 3D Prints — Create Admin User ===')
  const dbUrl = process.env.DATABASE_URL || 'file:local.db'
  console.log(`Database Target: ${dbUrl}\n`)

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

  console.log('\nGenerating cryptographic salt and computing PBKDF2 hash...')
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

  console.log(`Registering admin user in database...`)
  try {
    await client.execute({
      sql,
      args: [userId, email.toLowerCase(), hash, salt, PBKDF2_ITERATIONS],
    })
    console.log(`\n Successfully created / updated admin user: ${email}`)
    console.log(`User ID: ${userId}`)
    console.log('No password or secret was written to disk or environment.')
  } catch (err: any) {
    console.error('Failed to create admin user:', err.message)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
