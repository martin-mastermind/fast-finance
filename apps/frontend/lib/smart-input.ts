export interface ParsedInput {
  amount: number
  description: string
  suggestedCategory: string
  type: 'income' | 'expense'
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Еда': ['кофе', 'еда', 'обед', 'ужин', 'завтрак', 'ресторан', 'кафе', 'пицца', 'суши', 'продукты', 'магазин'],
  'Транспорт': ['такси', 'метро', 'автобус', 'бензин', 'парковка', 'uber', 'яндекс'],
  'Покупки': ['одежда', 'обувь', 'книга', 'электроника', 'телефон', 'ноутбук'],
  'Развлечения': ['кино', 'театр', 'концерт', 'игра', 'стриминг', 'подписка'],
  'Здоровье': ['аптека', 'врач', 'больница', 'лекарство', 'спорт', 'фитнес'],
  'Зарплата': ['зарплата', 'аванс', 'оклад', 'salary'],
  'Фриланс': ['фриланс', 'проект', 'клиент', 'заказ'],
}

const INCOME_KEYWORDS = ['зарплата', 'аванс', 'фриланс', 'доход', 'перевод', 'возврат', 'получил', 'salary']

export function parseSmartInput(input: string): ParsedInput | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Patterns: "500 кофе", "кофе 500", "-500 кофе", "+1000 зарплата"
  const patterns = [
    /^([+-]?\d+(?:[.,]\d+)?)\s+(.+)$/,  // "500 кофе"
    /^(.+?)\s+([+-]?\d+(?:[.,]\d+)?)$/,  // "кофе 500"
  ]

  let amount: number | null = null
  let description = ''

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      const maybeAmount = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(maybeAmount)) {
        amount = maybeAmount
        description = match[2].trim()
        break
      } else {
        const maybeAmount2 = parseFloat(match[2].replace(',', '.'))
        if (!isNaN(maybeAmount2)) {
          amount = maybeAmount2
          description = match[1].trim()
          break
        }
      }
    }
  }

  if (!amount) {
    // Maybe just a number
    const numOnly = parseFloat(trimmed.replace(',', '.'))
    if (!isNaN(numOnly)) {
      amount = numOnly
      description = ''
    } else {
      return null
    }
  }

  const descLower = description.toLowerCase()
  const isIncome = amount > 0 && INCOME_KEYWORDS.some(k => descLower.includes(k))
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'
  const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount)

  // Detect category
  let suggestedCategory = type === 'income' ? 'Зарплата' : 'Прочее'
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => descLower.includes(k))) {
      suggestedCategory = category
      break
    }
  }

  return { amount: finalAmount, description, suggestedCategory, type }
}
