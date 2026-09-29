const m = vi.hoisted(() => {
  const tx = {
    serviceRequest: { updateMany: vi.fn(), update: vi.fn() },
    requestEvent: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    blockedPhone: { upsert: vi.fn(), deleteMany: vi.fn() },
    user: { update: vi.fn() },
    session: { deleteMany: vi.fn() },
  };
  return {
    tx,
    db: {
      serviceRequest: { findUnique: vi.fn(), findMany: vi.fn() },
      user: { findUnique: vi.fn(), findFirst: vi.fn() },
      area: { findMany: vi.fn() },
      auditLog: tx.auditLog,
      requestEvent: tx.requestEvent,
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
    },
    role: { current: "operator" as string },
    resolveServiceRequestForm: vi.fn(),
    insertRequest: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "10.0.0.1" }) }));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "s".repeat(32), NODE_ENV: "test" } }));
vi.mock("@/lib/db", () => ({ db: m.db }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ success: true, retryAfter: 0 })),
}));
vi.mock("@/lib/session", async () => {
  const { checkAdmin } = await vi.importActual<typeof SessionModule>("@/lib/session");
  return {
    requireAdmin: async (permission: Parameters<typeof checkAdmin>[1]) =>
      checkAdmin(
        {
          user: {
            id: "admin_1",
            name: "Operator Ona",
            role: m.role.current,
            twoFactorEnabled: true,
            banned: false,
          },
        } as never,
        permission,
      ),
  };
});
vi.mock("@/features/requests/resolve-form", () => ({
  resolveServiceRequestForm: m.resolveServiceRequestForm,
  resolveCustomRequestForm: vi.fn(),
}));
vi.mock("@/features/requests/create", () => ({
  insertRequest: m.insertRequest,
  mediaByField: () => [],
}));

import { banUser, setUserRole } from "@/features/users/admin-actions";
import type * as SessionModule from "@/lib/session";
import { getTemplate } from "@/features/forms/templates";

import {
  addNote,
  assignRequest,
  blockPhone,
  changeStatus,
  createPhoneRequest,
  exportRequestsCsv,
  setQuote,
} from "./admin-actions";

beforeEach(() => {
  vi.clearAllMocks();
  m.role.current = "operator";
  m.db.serviceRequest.findUnique.mockResolvedValue({
    id: "req_1",
    code: "AB-260928-0001",
    status: "NEW",
    locale: "en",
    isSpam: false,
    assignedToId: null,
    quotedAmount: null,
    adminTags: [],
  });
  m.tx.serviceRequest.updateMany.mockResolvedValue({ count: 1 });
  m.tx.requestEvent.create.mockResolvedValue({ id: "ev_1" });
});

const tomorrow = new Date(Date.now() + 30 * 3600_000).toISOString().slice(0, 10);

const audits = () => m.tx.auditLog.create.mock.calls.map((call) => call[0].data);

describe("changeStatus", () => {
  it("moves the request with a guarded update, a visible event and an audit row", async () => {
    const result = await changeStatus({ code: "AB-260928-0001", to: "REVIEWING" });
    expect(result).toEqual({ ok: true, data: { status: "REVIEWING" } });
    expect(m.tx.serviceRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "req_1", status: "NEW" },
      data: { status: "REVIEWING", closedAt: null },
    });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "STATUS_CHANGE",
      fromStatus: "NEW",
      toStatus: "REVIEWING",
      visibleToUser: true,
      actorId: "admin_1",
    });
    expect(audits()).toEqual([
      expect.objectContaining({
        actorId: "admin_1",
        action: "request.status",
        entityId: "req_1",
        before: { status: "NEW" },
        ipHash: expect.stringMatching(/^[0-9a-f]{32}$/),
      }),
    ]);
  });

  it("refuses skipping steps and reopening", async () => {
    await expect(changeStatus({ code: "AB-260928-0001", to: "COMPLETED" })).resolves.toMatchObject({
      ok: false,
      status: 409,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("requires a customer message to reject", async () => {
    await expect(changeStatus({ code: "AB-260928-0001", to: "REJECTED" })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    await expect(
      changeStatus({ code: "AB-260928-0001", to: "REJECTED", message: "Out of area" }),
    ).resolves.toMatchObject({ ok: true });
    expect(m.tx.serviceRequest.updateMany.mock.calls[0]![0].data.closedAt).toBeInstanceOf(Date);
  });

  it("answers 409 when someone else changed the status first", async () => {
    m.tx.serviceRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(changeStatus({ code: "AB-260928-0001", to: "REVIEWING" })).resolves.toMatchObject({
      ok: false,
      status: 409,
    });
    expect(m.tx.requestEvent.create).not.toHaveBeenCalled();
    expect(m.tx.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("notes, assignment and quotes", () => {
  it("keeps internal notes hidden from the customer", async () => {
    await addNote({ code: "AB-260928-0001", message: "Called, no answer", visibleToUser: false });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "NOTE",
      visibleToUser: false,
    });
    expect(audits()[0]).toMatchObject({ action: "request.note" });
  });

  it("assigns only to active admins, as an internal event", async () => {
    m.db.user.findUnique.mockResolvedValue({ name: "Customer", role: "user", banned: false });
    await expect(assignRequest({ code: "AB-260928-0001", userId: "u_9" })).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    m.db.user.findUnique.mockResolvedValue({ name: "Karim", role: "operator", banned: false });
    await expect(
      assignRequest({ code: "AB-260928-0001", userId: "admin_2" }),
    ).resolves.toMatchObject({
      ok: true,
    });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "ASSIGNMENT",
      message: "Karim",
      visibleToUser: false,
    });
  });

  it("tells the customer the quote in the language they used", async () => {
    await setQuote({ code: "AB-260928-0001", amount: 1500 });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "QUOTE",
      visibleToUser: true,
      message: "Estimated cost ৳1,500",
    });
    expect(audits()[0]).toMatchObject({
      before: { quotedAmount: null },
      after: { quotedAmount: 1500 },
    });
  });
});

describe("phone blocklist", () => {
  it("normalizes the number before blocking", async () => {
    await blockPhone({ phone: "01712-345678", reason: "abuse" });
    expect(m.tx.blockedPhone.upsert.mock.calls[0]![0]).toMatchObject({
      where: { phone: "+8801712345678" },
      create: { phone: "+8801712345678", reason: "abuse", createdById: "admin_1" },
    });
  });
});

describe("createPhoneRequest", () => {
  it("creates a PHONE request linked to the caller's verified account", async () => {
    m.resolveServiceRequestForm.mockResolvedValue({
      type: "SERVICE",
      slug: "electrician",
      title: { bn: "ইলেকট্রিশিয়ান", en: "Electrician" },
      serviceId: "svc_1",
      categoryId: "cat_1",
      category: null,
      allowGuest: true,
      isEmergency: false,
      presets: {},
      formVersionId: "fv_1",
      schema: getTemplate("generic_service")!.schema,
    });
    m.db.user.findFirst.mockResolvedValue({ id: "user_7", locale: "en" });
    m.insertRequest.mockResolvedValue({ id: "req_9", code: "AB-260928-0009" });

    const result = await createPhoneRequest({
      target: { kind: "service", slug: "electrician" },
      payload: {
        common: {
          contactName: "Rahim",
          contactPhone: "01712345678",
          areaId: "satmatha",
          addressLine: "Road 1",
          preferredDate: tomorrow,
        },
        details: { description: "Fan is not working at all" },
      },
    });
    expect(result).toEqual({ ok: true, data: { code: "AB-260928-0009" } });
    expect(m.insertRequest.mock.calls[0]![0]).toMatchObject({
      source: "PHONE",
      userId: "user_7",
      isGuest: false,
      locale: "en",
      ipHash: null,
    });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "NOTE",
      visibleToUser: false,
    });
    expect(audits()[0]).toMatchObject({ action: "request.create_phone", entityId: "req_9" });
  });
});

describe("exportRequestsCsv", () => {
  it("returns a BOM-prefixed CSV and audits the export", async () => {
    m.db.serviceRequest.findMany.mockResolvedValue([
      {
        id: "r1",
        code: "AB-260928-0001",
        createdAt: new Date("2026-09-28T04:00:00Z"),
        status: "NEW",
        priority: "NORMAL",
        source: "WEB",
        isGuest: true,
        isSpam: false,
        title: null,
        contactName: "=cmd",
        contactPhone: "+8801712345678",
        altPhone: null,
        addressLine: null,
        preferredDate: null,
        preferredTimeSlot: null,
        notes: null,
        quotedAmount: null,
        adminTags: [],
        details: {},
        service: { nameBn: "ইলেকট্রিশিয়ান", nameEn: "Electrician" },
        category: null,
        area: null,
        assignedTo: null,
        formVersion: null,
      },
    ]);
    m.db.area.findMany.mockResolvedValue([]);
    const result = await exportRequestsCsv({ status: "NEW" });
    if (!result.ok) throw new Error(result.error);
    expect(result.data.csv.startsWith("﻿")).toBe(true);
    expect(result.data.csv).toContain("AB-260928-0001");
    expect(result.data.csv).toContain("'=cmd");
    expect(audits()[0]).toMatchObject({ action: "request.export", after: { rows: 1 } });
  });
});

describe("user moderation", () => {
  it("operators can neither ban nor change roles", async () => {
    await expect(banUser({ userId: "u_2", reason: "spam calls" })).resolves.toMatchObject({
      status: 403,
    });
    await expect(setUserRole({ userId: "u_2", role: "admin" })).resolves.toMatchObject({
      status: 403,
    });
  });

  it("admins ban customers (sessions revoked), never themselves or other admins", async () => {
    m.role.current = "admin";
    await expect(banUser({ userId: "admin_1", reason: "test self" })).resolves.toMatchObject({
      status: 409,
    });
    m.db.user.findUnique.mockResolvedValue({ id: "a_2", role: "operator", banned: false });
    await expect(banUser({ userId: "a_2", reason: "not allowed" })).resolves.toMatchObject({
      status: 409,
    });

    m.db.user.findUnique.mockResolvedValue({ id: "u_2", role: "user", banned: false });
    await expect(banUser({ userId: "u_2", reason: "fake requests" })).resolves.toMatchObject({
      ok: true,
    });
    expect(m.tx.user.update.mock.calls[0]![0].data).toMatchObject({
      banned: true,
      banReason: "fake requests",
    });
    expect(m.tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "u_2" } });
    expect(audits()[0]).toMatchObject({ action: "user.ban", entityId: "u_2" });
  });
});
