import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

export async function runMigrations() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = postgres(url, { max: 1 })

  try {
    const migrationPath = join(import.meta.dir, '../../migrations/0001_initial.sql')
    const migration = readFileSync(migrationPath, 'utf-8')
    await sql.unsafe(migration)
    console.log('Migrations applied')
  } finally {
    await sql.end()
  }
}
