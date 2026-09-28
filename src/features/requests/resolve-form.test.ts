const m = vi.hoisted(() => ({
  service: { findFirst: vi.fn() },
  formTemplate: { findUnique: vi.fn() },
  category: { findFirst: vi.fn() },
  serviceRequest: { findFirst: vi.fn(), findMany: vi.fn() },
  cookieValue: undefined as string | undefined,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (m.cookieValue ? { value: m.cookieValue } : undefined),
  }),
}));
vi.mock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "s".repeat(32) } }));
vi.mock("@/lib/db", () => ({
  db: {
    service: m.service,
    formTemplate: m.formTemplate,
    category: m.category,
    serviceRequest: m.serviceRequest,
  },
}));

import { getMyRequest, getTrackedRequest } from "./queries";
import { resolveCustomRequestForm, resolveServiceRequestForm } from "./resolve-form";
import { signTrackToken } from "./track-token";

const version = (id: string) => ({ currentVersion: { id, schema: { kind: "REQUEST" } } });

const serviceRow = (overrides: Record<string, unknown> = {}) => ({
  id: "svc_1",
  slug: "truck-rent",
  nameBn: "ট্রাক ভাড়া",
  allowGuest: true,
  isEmergency: false,
  formPresets: { pinned: { vehicleType: "truck" } },
  formTemplate: version("fv_service"),
  category: {
    id: "cat_1",
    slug: "rent-a-vehicle",
    nameBn: "গাড়ি ভাড়া",
    defaultFormTemplate: null,
  },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  m.cookieValue = undefined;
});

describe("resolveServiceRequestForm (service → category default → generic)", () => {
  it("uses the service's own template and presets", async () => {
    m.service.findFirst.mockResolvedValue(serviceRow());
    await expect(resolveServiceRequestForm("truck-rent")).resolves.toMatchObject({
      type: "SERVICE",
      serviceId: "svc_1",
      formVersionId: "fv_service",
      presets: { pinned: { vehicleType: "truck" } },
    });
    // Only ACTIVE services in an ACTIVE SERVICE category.
    expect(m.service.findFirst.mock.calls[0]![0].where).toMatchObject({
      status: "ACTIVE",
      category: { status: "ACTIVE", kind: "SERVICE" },
    });
  });

  it("falls back to the category default, then to generic_service", async () => {
    m.service.findFirst.mockResolvedValue(
      serviceRow({
        formTemplate: null,
        category: { ...serviceRow().category, defaultFormTemplate: version("fv_category") },
      }),
    );
    await expect(resolveServiceRequestForm("x")).resolves.toMatchObject({
      formVersionId: "fv_category",
    });

    m.service.findFirst.mockResolvedValue(serviceRow({ formTemplate: null }));
    m.formTemplate.findUnique.mockResolvedValue(version("fv_generic"));
    await expect(resolveServiceRequestForm("x")).resolves.toMatchObject({
      formVersionId: "fv_generic",
    });
    expect(m.formTemplate.findUnique.mock.calls[0]![0].where).toEqual({ key: "generic_service" });
  });

  it("returns null for unknown/inactive slugs", async () => {
    m.service.findFirst.mockResolvedValue(null);
    await expect(resolveServiceRequestForm("nope")).resolves.toBeNull();
  });

  it("custom request: type CUSTOM, no service, custom_request template", async () => {
    m.category.findFirst.mockResolvedValue({
      id: "cat_c",
      slug: "custom-request",
      nameBn: "কাস্টম",
    });
    m.formTemplate.findUnique.mockResolvedValue(version("fv_custom"));
    await expect(resolveCustomRequestForm()).resolves.toMatchObject({
      type: "CUSTOM",
      serviceId: null,
      categoryId: "cat_c",
      formVersionId: "fv_custom",
    });
    expect(m.formTemplate.findUnique.mock.calls[0]![0].where).toEqual({ key: "custom_request" });
  });
});

describe("request queries (IDOR)", () => {
  it("getMyRequest is scoped to the owner", async () => {
    m.serviceRequest.findFirst.mockResolvedValue(null);
    await expect(getMyRequest("user_a", "AB-260928-0001")).resolves.toBeNull();
    expect(m.serviceRequest.findFirst.mock.calls[0]![0].where).toEqual({
      code: "AB-260928-0001",
      userId: "user_a",
    });
  });

  it("only shows user-visible timeline events", async () => {
    m.serviceRequest.findFirst.mockResolvedValue(null);
    await getMyRequest("user_a", "AB-260928-0001");
    expect(m.serviceRequest.findFirst.mock.calls[0]![0].select.events.where).toEqual({
      visibleToUser: true,
    });
  });

  it("getTrackedRequest needs a valid cookie for that exact request", async () => {
    await expect(getTrackedRequest("AB-260928-0001")).resolves.toBeNull();
    expect(m.serviceRequest.findFirst).not.toHaveBeenCalled();

    m.cookieValue = signTrackToken("req1abcdefgh", "s".repeat(32));
    m.serviceRequest.findFirst.mockResolvedValue(null);
    await getTrackedRequest("AB-260928-0001");
    expect(m.serviceRequest.findFirst.mock.calls[0]![0].where).toEqual({
      id: "req1abcdefgh",
      code: "AB-260928-0001",
    });
  });
});
