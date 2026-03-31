import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Elysia } from "elysia";

const mockAccount = { id: 1, userId: 1, name: "Карта", balance: 5000 };
const mockTransaction = {
  id: "uuid-123",
  userId: 1,
  accountId: 1,
  categoryId: 1,
  amount: -500,
  description: "кофе",
  date: new Date(),
};

type MockDbChain = {
  select: ReturnType<typeof mock>;
  insert: ReturnType<typeof mock>;
  update: ReturnType<typeof mock>;
  delete: ReturnType<typeof mock>;
  from: ReturnType<typeof mock>;
  where: ReturnType<typeof mock>;
  values: ReturnType<typeof mock>;
  set: ReturnType<typeof mock>;
  orderBy: ReturnType<typeof mock>;
  limit: ReturnType<typeof mock>;
  offset: ReturnType<typeof mock>;
  returning: ReturnType<typeof mock>;
};

const mockDbChain: MockDbChain = {
  select: mock(() => mockDbChain),
  insert: mock(() => mockDbChain),
  update: mock(() => mockDbChain),
  delete: mock(() => mockDbChain),
  from: mock(() => mockDbChain),
  where: mock(() => mockDbChain),
  values: mock(() => mockDbChain),
  set: mock(() => mockDbChain),
  orderBy: mock(() => mockDbChain),
  limit: mock(() => mockDbChain),
  offset: mock(() => mockDbChain),
  returning: mock(() => Promise.resolve([])),
};

mock.module("drizzle-orm", () => ({
  eq: mock((..._args: unknown[]) => "eq"),
  and: mock((..._args: unknown[]) => "and"),
  desc: mock((..._args: unknown[]) => "desc"),
  sql: mock((..._args: unknown[]) => "sql"),
  count: mock(() => ({ total: 0 })),
}));

mock.module("@fast-finance/db", () => ({
  db: mockDbChain,
  transactions: { id: "id", userId: "user_id", date: "date" },
  accounts: { id: "id", userId: "user_id", balance: "balance" },
}));

const { transactionsRouter } = await import("../../routes/transactions");
const app = new Elysia().use(transactionsRouter);

function makeRequest(
  method: string,
  path: string,
  opts: { userId?: number; body?: unknown } = {},
) {
  const { userId = 1, body } = opts;
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-user-id": String(userId),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("GET /transactions", () => {
  beforeEach(() => {
    mockDbChain.select.mockReset();
    mockDbChain.from.mockReset();
    mockDbChain.where.mockReset();
    mockDbChain.orderBy.mockReset();
    mockDbChain.limit.mockReset();
    mockDbChain.offset.mockReset();

    mockDbChain.select.mockReturnValue(mockDbChain);
    mockDbChain.from.mockReturnValue(mockDbChain);
    mockDbChain.where
      .mockResolvedValueOnce([{ total: 2 }]) // count query
      .mockReturnValueOnce(mockDbChain); // list query chain
    mockDbChain.orderBy.mockReturnValue(mockDbChain);
    mockDbChain.limit.mockReturnValue(mockDbChain);
    mockDbChain.offset.mockResolvedValueOnce([mockTransaction]); // list query result
  });

  it("returns paginated transactions", async () => {
    const res = await makeRequest("GET", "/transactions?limit=10&offset=0");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("page");
    expect(data).toHaveProperty("pageSize");
  });

  it("returns 401 without user id", async () => {
    const res = await app.handle(new Request("http://localhost/transactions"));
    expect(res.status).toBe(401);
  });
});

describe("POST /transactions", () => {
  beforeEach(() => {
    mockDbChain.select.mockReset();
    mockDbChain.from.mockReset();
    mockDbChain.insert.mockReset();
    mockDbChain.update.mockReset();
    mockDbChain.where.mockReset();
    mockDbChain.values.mockReset();
    mockDbChain.set.mockReset();
    mockDbChain.returning.mockReset();

    mockDbChain.select.mockReturnValue(mockDbChain);
    mockDbChain.from.mockReturnValue(mockDbChain);
    mockDbChain.insert.mockReturnValue(mockDbChain);
    mockDbChain.update.mockReturnValue(mockDbChain);
    mockDbChain.values.mockReturnValue(mockDbChain);
    mockDbChain.set.mockReturnValue(mockDbChain);
  });

  it("returns 403 when account does not belong to user", async () => {
    // Account ownership check returns empty array
    mockDbChain.where.mockResolvedValueOnce([]);

    const res = await makeRequest("POST", "/transactions", {
      body: { accountId: 99, categoryId: 1, amount: -500, description: "кофе" },
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("denied");
  });

  it("creates transaction when account belongs to user", async () => {
    // Account ownership check returns account
    mockDbChain.where
      .mockResolvedValueOnce([mockAccount]) // ownership check
      .mockResolvedValueOnce([]); // balance update
    mockDbChain.returning.mockResolvedValueOnce([mockTransaction]);

    const res = await makeRequest("POST", "/transactions", {
      body: { accountId: 1, categoryId: 1, amount: -500, description: "кофе" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.amount).toBe(-500);
    expect(data.description).toBe("кофе");
  });
});

describe("DELETE /transactions/:id", () => {
  beforeEach(() => {
    mockDbChain.delete.mockReset();
    mockDbChain.update.mockReset();
    mockDbChain.set.mockReset();
    mockDbChain.where.mockReset();
    mockDbChain.returning.mockReset();

    mockDbChain.delete.mockReturnValue(mockDbChain);
    mockDbChain.update.mockReturnValue(mockDbChain);
    mockDbChain.set.mockReturnValue(mockDbChain);
  });

  it("returns 404 for non-existent transaction", async () => {
    mockDbChain.where.mockReturnValueOnce(mockDbChain); // delete chain
    mockDbChain.returning.mockResolvedValueOnce([]); // delete returns empty

    const res = await makeRequest("DELETE", "/transactions/non-existent-uuid");
    expect(res.status).toBe(404);
  });

  it("deletes transaction and reverses balance", async () => {
    mockDbChain.where
      .mockReturnValueOnce(mockDbChain) // delete chain
      .mockResolvedValueOnce([]); // balance update
    mockDbChain.returning.mockResolvedValueOnce([mockTransaction]);

    const res = await makeRequest("DELETE", "/transactions/uuid-123");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
