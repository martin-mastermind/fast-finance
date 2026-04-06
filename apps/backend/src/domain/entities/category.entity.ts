export interface Category {
  id: number
  name: string
  icon: string
  type: 'income' | 'expense' | 'transfer'
  userId: number | null
}