import { getRawLibSqlClient, runMigrations } from '../lib/db'
import { generateSalt, hashPassword, PBKDF2_ITERATIONS } from '../lib/auth'

async function seedAdmin() {
  const client = getRawLibSqlClient()
  await runMigrations(client)

  const email = 'admin@falcon3dprints.com'
  const salt = generateSalt(32)
  const hash = await hashPassword('SuperSecretFalconPassword2026!', salt, PBKDF2_ITERATIONS)
  const userId = 'usr_admin_default'

  await client.execute({
    sql: `
      INSERT INTO users (id, email, password_hash, password_salt, pbkdf2_iters, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        password_salt = excluded.password_salt,
        pbkdf2_iters = excluded.pbkdf2_iters,
        is_active = 1,
        updated_at = unixepoch();
    `,
    args: [userId, email, hash, salt, PBKDF2_ITERATIONS],
  })

  console.log('Seeded admin in local database successfully:', email)
}

seedAdmin().catch(console.error)
