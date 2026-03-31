import { db } from './client'
import { categories } from './schema'

const defaultCategories = [
  { name: 'Еда', icon: 'UtensilsCrossed', type: 'expense' as const },
  { name: 'Транспорт', icon: 'Car', type: 'expense' as const },
  { name: 'Покупки', icon: 'ShoppingBag', type: 'expense' as const },
  { name: 'Развлечения', icon: 'Gamepad2', type: 'expense' as const },
  { name: 'Здоровье', icon: 'Heart', type: 'expense' as const },
  { name: 'Жильё', icon: 'Home', type: 'expense' as const },
  { name: 'Образование', icon: 'GraduationCap', type: 'expense' as const },
  { name: 'Прочее', icon: 'MoreHorizontal', type: 'expense' as const },
  { name: 'Зарплата', icon: 'Wallet', type: 'income' as const },
  { name: 'Фриланс', icon: 'Laptop', type: 'income' as const },
  { name: 'Подарок', icon: 'Gift', type: 'income' as const },
]

async function seed() {
  console.log('Seeding categories...')
  await db.insert(categories).values(defaultCategories).onConflictDoNothing()
  console.log('Done!')
  process.exit(0)
}

seed().catch(console.error)
