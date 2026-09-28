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

const categoryRow = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  slug: "home-office",
  kind: "SERVICE",
  nameBn: "হোম ও অফিস",
  nameEn: "Home & Office",
  shortDescBn: "ঘরের কাজ",
  shortDescEn: null,
  iconKey: "house",
  introContent: "বাংলা",
  introContentEn: "English intro",
  seoTitle: null,
  seoTitleEn: null,
  seoDescription: null,
  seoDescriptionEn: null,
  faqs: [{ q: "a?", a: "b" }, 3],
  faqsEn: [],
  services: [],
  ...overrides,
});

describe("resolveCatalogSlug", () => {
  it("resolves a category first, with parsed FAQs", async () => {
    category.findFirst.mockResolvedValue(categoryRow());
    const entry = await resolveCatalogSlug("home-office", "bn");
    expect(entry).toMatchObject({
      type: "category",
      category: { slug: "home-office", name: "হোম ও অফিস", faqs: [{ q: "a?", a: "b" }] },
    });
    expect(category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "home-office", status: "ACTIVE" } }),
    );
    expect(service.findFirst).not.toHaveBeenCalled();
    expect(cacheTag).toHaveBeenCalledWith("catalog", "category:home-office", "service:home-office");
  });

  it("falls back to an ACTIVE service whose category is ACTIVE", async () => {
    category.findFirst.mockResolvedValue(null);
    service.findFirst.mockResolvedValue({
      id: "s1",
      slug: "electrician",
      nameBn: "ইলেকট্রিশিয়ান",
      nameEn: "Electrician",
      shortDescBn: "ওয়্যারিং",
      shortDescEn: "Wiring",
      iconKey: "zap",
      startingPrice: null,
      isEmergency: false,
      description: "বাংলা",
      descriptionEn: null,
      priceNote: null,
      priceNoteEn: null,
      seoTitle: null,
      seoTitleEn: null,
      seoDescription: null,
      seoDescriptionEn: null,
      faqs: [{ q: "প্রশ্ন?", a: "উত্তর" }],
      faqsEn: [{ q: "Question?", a: "Answer" }],
      category: { slug: "home-office", nameBn: "হোম", nameEn: "Home", kind: "SERVICE" },
    });
    await expect(resolveCatalogSlug("electrician", "en")).resolves.toMatchObject({
      type: "service",
      service: {
        name: "Electrician",
        shortDesc: "Wiring",
        // Missing English falls back to Bangla, field by field.
        description: "বাংলা",
        faqs: [{ q: "Question?", a: "Answer" }],
        category: { name: "Home" },
      },
    });
    expect(service.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "electrician", status: "ACTIVE", category: { status: "ACTIVE" } },
      }),
    );
  });

  it("returns null (→ 404) for unknown, hidden or draft slugs", async () => {
    category.findFirst.mockResolvedValue(null);
    service.findFirst.mockResolvedValue(null);
    await expect(resolveCatalogSlug("nope", "bn")).resolves.toBeNull();
  });

  it("resolves English text with Bangla fallback for empty fields", async () => {
    category.findFirst.mockResolvedValue(categoryRow());
    await expect(resolveCatalogSlug("home-office", "en")).resolves.toMatchObject({
      category: {
        name: "Home & Office",
        shortDesc: "ঘরের কাজ",
        introContent: "English intro",
        faqs: [{ q: "a?", a: "b" }],
      },
    });
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
