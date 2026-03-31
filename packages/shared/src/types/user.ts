export interface User {
  id: number
  telegramId: string
  username: string | null
  currency: string
  createdAt: Date
}

export interface CreateUserDto {
  telegramId: string
  username?: string
  currency?: string
}
