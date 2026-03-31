export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
  statusCode: number
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface TelegramAuthPayload {
  initData: string
}

export interface AuthResponse {
  user: {
    id: number
    telegramId: string
    username: string | null
    currency: string
  }
}
