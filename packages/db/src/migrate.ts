import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

function resolveMigrationPath(): string {
  const file = '0001_initial.sql'
  const candidates = [
    join(import.meta.dir, '../../migrations', file),
    join(process.cwd(), 'packages/db/migrations', file),
    join(process.cwd(), '../../packages/db/migrations', file),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  throw new Error(`Файл миграции не найден. Проверено:\n${candidates.join('\n')}`)
}

export async function runMigrations() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const sql = postgres(url, { max: 1 })

  try {
    const migrationPath = resolveMigrationPath()
    const migration = readFileSync(migrationPath, 'utf-8')
    await sql.unsafe(migration)
    console.log('Migrations applied')
  } finally {
    await sql.end()
  }
}
