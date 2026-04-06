export abstract class DomainError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class AccessDeniedError extends DomainError {
  readonly code = 'ACCESS_DENIED'
  readonly statusCode = 403

  constructor(message = 'Access denied') {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404

  constructor(message = 'Resource not found') {
    super(message)
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
  }
}

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS'
  readonly statusCode = 400

  constructor(message = 'Insufficient funds') {
    super(message)
  }
}