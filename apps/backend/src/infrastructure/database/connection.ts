import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@fast-finance/db'

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fast_finance'

export const client = postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
})

export const db = drizzle(client, { schema })

export type Database = typeof db