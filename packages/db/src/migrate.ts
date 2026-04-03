import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

function resolveMigrationDir(): string {
  const candidates = [
    join(import.meta.dir, '../../migrations'),
    join(process.cwd(), 'packages/db/migrations'),
    join(process.cwd(), '../../packages/db/migrations'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error(`Migrations directory not found. Checked:\n${candidates.join('\n')}`)
}

export async function runMigrations() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = postgres(url, { max: 1 })

  try {
    const migrationDir = resolveMigrationDir()
    const files = readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const migrationPath = join(migrationDir, file)
      const migration = readFileSync(migrationPath, 'utf-8')
      await sql.unsafe(migration)
      console.log(`Applied migration: ${file}`)
    }
    console.log('All migrations applied')
  } finally {
    await sql.end()
  }
}
