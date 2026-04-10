import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@fast-finance/db'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

export const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 50 : 10,
  idle_timeout: 20,
})

export const db = drizzle(client, { schema })

export type Database = typeof db