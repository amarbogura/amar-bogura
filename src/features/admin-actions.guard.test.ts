/// <reference types="vite/client" />
// Proves D-09 / CLAUDE.md "every admin action: server-side role check": EVERY exported admin Server
// Action (any src/features/**/admin-actions.ts, including ones added in later phases) refuses
// non-admins with 403 before touching the database. The real session → action pipeline runs;
// only Better Auth's session lookup, the DB, Upstash and request headers are replaced.

const { getAuthSession, dbCalls, fakeDb } = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  dbCalls: [] as string[],
  fakeDb: { impl: {} as Record<string, unknown> },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.7" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "s".repeat(32), NODE_ENV: "test" } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: getAuthSession } } }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ success: true, retryAfter: 0 })),
}));

// A DB that records every access. Forbidden calls must leave `dbCalls` empty.
vi.mock("@/lib/db", () => ({
  db: new Proxy(
    {},
    {
      get: (_target, model: string) => {
        dbCalls.push(model);
        return fakeDb.impl[model];
      },
    },
  ),
}));

type Action = (input: unknown) => Promise<{ ok: boolean; status?: number }>;

const modules = import.meta.glob("/src/features/**/admin-actions.ts", { eager: true }) as Record<
  string,
  Record<string, unknown>
>;
const actions: Array<[string, Action]> = Object.entries(modules).flatMap(([file, exports]) =>
  Object.entries(exports)
    .filter(([, value]) => typeof value === "function")
    .map(([name, value]): [string, Action] => [
      `${file.replace("/src/features/", "")}#${name}`,
      value as Action,
    ]),
);

const baseUser = {
  id: "user_1",
  name: "Rahim",
  email: "8801712345678@phone.amarbogura.invalid",
  emailVerified: false,
  phoneNumber: "+8801712345678",
  phoneNumberVerified: true,
  banned: false,
  twoFactorEnabled: false,
};
const sessionFor = (user: Partial<typeof baseUser> & { role: string }) => ({
  user: { ...baseUser, ...user },
  session: { id: "sess_1", userId: user.id ?? baseUser.id, token: "t" },
});

// Inputs a caller might send: nothing, garbage, and a well-formed-looking payload.
const inputs: unknown[] = [undefined, {}, "x", { userId: "user_2", role: "super_admin" }];

beforeEach(() => {
  dbCalls.length = 0;
  fakeDb.impl = {};
  getAuthSession.mockReset();
});

describe("admin Server Action guard", () => {
  it("discovers the admin actions to test", () => {
    expect(actions.map(([name]) => name)).toContain("users/admin-actions.ts#setUserRole");
  });

  describe.each(actions)("%s", (_name, action) => {
    it("returns 403 to a normal user and never touches the database", async () => {
      getAuthSession.mockResolvedValue(sessionFor({ role: "user" }));
      for (const input of inputs) {
        await expect(action(input)).resolves.toMatchObject({ ok: false, status: 403 });
      }
      expect(dbCalls).toEqual([]);
    });

    it("returns 403 to a normal user even if their 2FA flag is set", async () => {
      getAuthSession.mockResolvedValue(sessionFor({ role: "user", twoFactorEnabled: true }));
      await expect(action({})).resolves.toMatchObject({ ok: false, status: 403 });
      expect(dbCalls).toEqual([]);
    });

    it("returns 403 for an unknown / tampered role", async () => {
      getAuthSession.mockResolvedValue(sessionFor({ role: "root", twoFactorEnabled: true }));
      await expect(action({})).resolves.toMatchObject({ ok: false, status: 403 });
      expect(dbCalls).toEqual([]);
    });

    it("returns 401 to a guest", async () => {
      getAuthSession.mockResolvedValue(null);
      await expect(action({})).resolves.toMatchObject({ ok: false, status: 401 });
      expect(dbCalls).toEqual([]);
    });

    it("returns 403 to an admin who has not enabled 2FA", async () => {
      getAuthSession.mockResolvedValue(
        sessionFor({ role: "super_admin", twoFactorEnabled: false }),
      );
      await expect(action({})).resolves.toMatchObject({ ok: false, status: 403 });
      expect(dbCalls).toEqual([]);
    });

    it("returns 403 to a banned admin", async () => {
      getAuthSession.mockResolvedValue(
        sessionFor({ role: "super_admin", twoFactorEnabled: true, banned: true }),
      );
      await expect(action({})).resolves.toMatchObject({ ok: false, status: 403 });
      expect(dbCalls).toEqual([]);
    });
  });
});

describe("setUserRole (admins.manage — super_admin only)", () => {
  const load = async () => (await import("@/features/users/admin-actions")).setUserRole;

  it.each(["operator", "admin"])("refuses %s with 403", async (role) => {
    const setUserRole = await load();
    getAuthSession.mockResolvedValue(sessionFor({ id: "adm", role, twoFactorEnabled: true }));
    await expect(setUserRole({ userId: "user_2", role: "admin" })).resolves.toMatchObject({
      ok: false,
      status: 403,
    });
    expect(dbCalls).toEqual([]);
  });

  it("lets a super_admin change a role, revoking sessions and writing an audit row", async () => {
    const setUserRole = await load();
    const tx = {
      user: { update: vi.fn() },
      session: { deleteMany: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    fakeDb.impl = {
      user: {
        findUnique: vi.fn(async () => ({
          id: "user_2",
          role: "user",
          accounts: [{ providerId: "credential" }],
        })),
      },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    };
    getAuthSession.mockResolvedValue(
      sessionFor({ id: "root", role: "super_admin", twoFactorEnabled: true }),
    );

    await expect(setUserRole({ userId: "user_2", role: "operator" })).resolves.toEqual({
      ok: true,
      data: { userId: "user_2", role: "operator" },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: { role: "operator" },
    });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_2" } });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "root",
        action: "user.set_role",
        entityId: "user_2",
        before: { role: "user" },
        after: { role: "operator" },
      }),
    });
  });

  it("refuses to promote a user without a password account to an admin role", async () => {
    const setUserRole = await load();
    fakeDb.impl = {
      user: { findUnique: vi.fn(async () => ({ id: "user_2", role: "user", accounts: [] })) },
    };
    getAuthSession.mockResolvedValue(
      sessionFor({ id: "root", role: "super_admin", twoFactorEnabled: true }),
    );
    await expect(setUserRole({ userId: "user_2", role: "admin" })).resolves.toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("refuses to change the caller's own role", async () => {
    const setUserRole = await load();
    getAuthSession.mockResolvedValue(
      sessionFor({ id: "root", role: "super_admin", twoFactorEnabled: true }),
    );
    await expect(setUserRole({ userId: "root", role: "user" })).resolves.toMatchObject({
      ok: false,
      status: 409,
    });
    expect(dbCalls).toEqual([]);
  });

  it("rejects invalid input with 400 (after authorization)", async () => {
    const setUserRole = await load();
    getAuthSession.mockResolvedValue(
      sessionFor({ id: "root", role: "super_admin", twoFactorEnabled: true }),
    );
    await expect(setUserRole({ userId: "user_2", role: "god" as never })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
