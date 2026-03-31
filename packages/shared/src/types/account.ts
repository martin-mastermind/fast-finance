export interface Account {
  id: number
  userId: number
  name: string
  balance: number
}

export interface CreateAccountDto {
  name: string
  balance?: number
}

export interface UpdateAccountDto {
  name?: string
  balance?: number
}
