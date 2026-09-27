const { category, service, cacheTag } = vi.hoisted(() => ({
  category: { findFirst: vi.fn(), findMany: vi.fn() },
  service: { findFirst: vi.fn(), findMany: vi.fn() },
  cacheTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag }));
vi.mock("@/lib/db", () => ({ db: { category, service } }));

import { getCatalogStaticParams, resolveCatalogSlug } from "./queries";

beforeEach(() => vi.clearAllMocks());

describe("resolveCatalogSlug", () => {
  it("resolves a category first, with parsed FAQs", async () => {
    category.findFirst.mockResolvedValue({
      slug: "home-office",
      kind: "SERVICE",
      faqs: [{ q: "a?", a: "b" }, 3],
    });
    const entry = await resolveCatalogSlug("home-office");
    expect(entry).toMatchObject({
      type: "category",
      category: { slug: "home-office", faqs: [{ q: "a?", a: "b" }] },
    });
    expect(category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "home-office", status: "ACTIVE" } }),
    );
    expect(service.findFirst).not.toHaveBeenCalled();
    expect(cacheTag).toHaveBeenCalledWith("catalog", "category:home-office", "service:home-office");
  });

  it("falls back to an ACTIVE service whose category is ACTIVE", async () => {
    category.findFirst.mockResolvedValue(null);
    service.findFirst.mockResolvedValue({ slug: "electrician", faqs: [] });
    await expect(resolveCatalogSlug("electrician")).resolves.toMatchObject({ type: "service" });
    expect(service.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "electrician", status: "ACTIVE", category: { status: "ACTIVE" } },
      }),
    );
  });

  it("returns null (→ 404) for unknown, hidden or draft slugs", async () => {
    category.findFirst.mockResolvedValue(null);
    service.findFirst.mockResolvedValue(null);
    await expect(resolveCatalogSlug("nope")).resolves.toBeNull();
  });
});

describe("getCatalogStaticParams", () => {
  it("prerenders only SERVICE-kind categories and active services", async () => {
    category.findMany.mockResolvedValue([{ slug: "home-office" }]);
    service.findMany.mockResolvedValue([{ slug: "electrician" }]);
    await expect(getCatalogStaticParams()).resolves.toEqual([
      { slug: "home-office" },
      { slug: "electrician" },
    ]);
    expect(category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "ACTIVE", kind: "SERVICE" } }),
    );
  });
});
