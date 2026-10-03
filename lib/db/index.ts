import { createClient, Client } from '@libsql/client'
import fs from 'fs'
import path from 'path'

export interface PreparedStatement {
  sql: string
  params: any[]
  bind(...args: any[]): PreparedStatement
  first<T = any>(): Promise<T | null>
  all<T = any>(): Promise<{ results: T[] }>
  run(): Promise<{ success: boolean; meta?: any }>
}

export interface DatabaseClient {
  prepare(sql: string): PreparedStatement
  batch(statements: PreparedStatement[]): Promise<any[]>
  execute(query: string | { sql: string; args: any[] }): Promise<any>
}

let globalClient: Client | null = null
let migrationsApplied = false

export function getRawLibSqlClient(): Client {
  if (!globalClient) {
    const url = process.env.DATABASE_URL || 'file:local.db'
    const authToken = process.env.DATABASE_AUTH_TOKEN

    globalClient = createClient({
      url,
      authToken,
    })
  }
  return globalClient
}

function createPreparedStatement(client: Client, sql: string, params: any[] = []): PreparedStatement {
  return {
    sql,
    params,
    bind(...args: any[]) {
      return createPreparedStatement(client, sql, args)
    },
    async first<T = any>(): Promise<T | null> {
      const res = await client.execute({ sql, args: params })
      return (res.rows[0] as unknown as T) ?? null
    },
    async all<T = any>(): Promise<{ results: T[] }> {
      const res = await client.execute({ sql, args: params })
      return { results: res.rows as unknown as T[] }
    },
    async run(): Promise<{ success: boolean; meta?: any }> {
      const res = await client.execute({ sql, args: params })
      return { success: true, meta: { rowsAffected: res.rowsAffected } }
    },
  }
}

export async function runMigrations(client: Client) {
  if (migrationsApplied) return
  try {
    // Migration tracking table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `)

    const migrationsDir = path.join(process.cwd(), 'migrations')
    if (!fs.existsSync(migrationsDir)) return

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      const check = await client.execute({
        sql: 'SELECT name FROM _migrations WHERE name = ?',
        args: [file],
      })

      if (check.rows.length === 0) {
        const fullPath = path.join(migrationsDir, file)
        const sqlContent = fs.readFileSync(fullPath, 'utf8')
        
        // Execute SQL commands splitting by semicolon while respecting transactions
        // libSQL executeMultiple handles multi-statement SQL safely
        if (typeof (client as any).executeMultiple === 'function') {
          await (client as any).executeMultiple(sqlContent)
        } else {
          const statements = sqlContent
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0)
          for (const s of statements) {
            await client.execute(s)
          }
        }

        await client.execute({
          sql: 'INSERT INTO _migrations (name, applied_at) VALUES (?, unixepoch())',
          args: [file],
        })
      }
    }
    migrationsApplied = true
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Migrations] Notice during migration check:', err instanceof Error ? err.message : err)
    }
  }
}

export async function getDB(): Promise<DatabaseClient | null> {
  try {
    const client = getRawLibSqlClient()
    // Auto-check migrations locally
    if (!migrationsApplied && (process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL)) {
      await runMigrations(client)
    }

    return {
      prepare(sql: string) {
        return createPreparedStatement(client, sql)
      },
      async batch(statements: PreparedStatement[]) {
        const batchArgs = statements.map(s => ({
          sql: s.sql,
          args: s.params,
        }))
        const res = await client.batch(batchArgs, 'write')
        return res
      },
      async execute(query: string | { sql: string; args: any[] }) {
        return client.execute(query)
      },
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DB] getDB failed, falling back:', error)
    }
    return null
  }
}
