import { db } from './client'
import { categories } from './schema'

const defaultCategories = [
  { name: 'Еда', icon: '🍔', type: 'expense' as const },
  { name: 'Транспорт', icon: '🚕', type: 'expense' as const },
  { name: 'Покупки', icon: '🛍️', type: 'expense' as const },
  { name: 'Развлечения', icon: '🎮', type: 'expense' as const },
  { name: 'Здоровье', icon: '💊', type: 'expense' as const },
  { name: 'Жильё', icon: '🏠', type: 'expense' as const },
  { name: 'Образование', icon: '📚', type: 'expense' as const },
  { name: 'Прочее', icon: '•••', type: 'expense' as const },
  { name: 'Зарплата', icon: '💰', type: 'income' as const },
  { name: 'Фриланс', icon: '💻', type: 'income' as const },
  { name: 'Подарок', icon: '🎁', type: 'income' as const },
]

async function seed() {
  console.log('Seeding categories...')
  await db.insert(categories).values(defaultCategories).onConflictDoNothing()
  console.log('Done!')
  process.exit(0)
}

seed().catch(console.error)
