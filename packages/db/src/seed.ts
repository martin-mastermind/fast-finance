import { db } from './client'
import { categories } from './schema'

async function seed() {
  console.log('No default categories to seed - users create their own')
  process.exit(0)
}

seed().catch(console.error)
