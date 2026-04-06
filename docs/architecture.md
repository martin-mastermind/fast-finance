# Чистая архитектура - Fast Finance

## Слои (Dependency Rule →)

```
presentation/  →  application/  →  domain/
    (routes)       (use-cases)      (entities, interfaces)
       ↑                ↑
       └────────────────┘
         infrastructure/
    (repositories, database)
```

## Структура

```
src/
├── domain/
│   ├── entities/        # Сущности (Account, Transaction, Category)
│   ├── interfaces/      # IAccountRepository, ITransactionRepository
│   ├── errors/          # DomainError, AccessDeniedError, NotFoundError
│   └── index.ts         # Экспорт всех domain типов
├── application/
│   └── use-cases/       # AccountUseCases, TransactionUseCases
├── infrastructure/
│   ├── database/        # db connection
│   └── repositories/   # DrizzleAccountRepository, DrizzleTransactionRepository
└── presentation/
    └── routes/         # Elysia роутеры
```

## Правила

1. **Domain** - не зависит от других слоев. Содержит бизнес-правила.
2. **Interfaces** - определены в domain, реализации в infrastructure.
3. **Use Cases** - зависят от интерфейсов (через constructor injection).
4. **Repositories** - реализуют интерфейсы из domain.
5. **Routes** - преобразуют HTTP в use cases, обрабатывают DomainError.

## Типизация

- Все сущности имеют `toEntity()` mapper из DB моделей
- Валидация через Elysia t.* схемы в routes
- Currency: `'RUB' | 'BYN' | 'USD'`

## Пример добавления нового сервиса

1. Создать `domain/entities/new-entity.ts`
2. Создать `domain/interfaces/i-new-repository.interface.ts`
3. Создать `domain/errors/` если нужно
4. Реализовать `infrastructure/repositories/new.repository.ts`
5. Создать `application/use-cases/new.use-cases.ts`
6. Создать `presentation/routes/new.ts`

## Тесты

- Domain: Unit tests (jest/bun test)
- Infrastructure: Integration tests
- Routes: API tests

---

## Frontend Architecture (Next.js)

```
src/
├── domain/types/      # Account, Transaction, Category, User
├── application/hooks/ # useAccounts, useTransactions, useCategories
├── infrastructure/api/ # apiClient (HTTP client)
└── presentation/     # (components/pages - existing)
```

### Правила Frontend

- **Hooks** - инкапсулируют бизнес-логику, работают с userId из store
- **API Client** - stateless HTTP обёртка над fetch
- **Domain Types** - зеркалируют backend entities
- **Store** - только состояние UI (activeTab, modals), НЕ бизнес-данные

### Пример добавления хука

1. Создать `domain/types/new-entity.ts`
2. Добавить метод в `infrastructure/api/client.ts`
3. Создать `application/hooks/use-entity.ts`
4. Использовать в компонентах