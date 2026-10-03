import { getRawLibSqlClient, runMigrations } from '../lib/db'

async function main() {
  console.log('--- Running Database Migrations ---')
  const client = getRawLibSqlClient()
  console.log('Target URL:', process.env.DATABASE_URL || 'file:local.db')
  await runMigrations(client)
  console.log('Migrations completed successfully!')
  process.exit(0)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
