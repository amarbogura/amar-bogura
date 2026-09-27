import { catalogMetadata, toPlainSummary } from "./metadata";
import type { CatalogCategory, CatalogService } from "./types";

const category: CatalogCategory = {
  id: "c1",
  slug: "home-office",
  kind: "SERVICE",
  nameBn: "হোম ও অফিস সার্ভিস",
  nameEn: "Home & Office Services",
  shortDescBn: "ঘরের সব কাজ",
  iconKey: "house",
  introContent: "## শিরোনাম\n\nবগুড়ার **সব** কাজ।",
  seoTitle: null,
  seoDescription: null,
  faqs: [],
  services: [],
};

const service: CatalogService = {
  id: "s1",
  slug: "electrician",
  nameBn: "ইলেকট্রিশিয়ান",
  nameEn: "Electrician",
  shortDescBn: "ওয়্যারিং",
  iconKey: "zap",
  startingPrice: null,
  isEmergency: false,
  description: "বগুড়ায় [ইলেকট্রিক](https://x.test) কাজ।",
  priceNote: null,
  seoTitle: null,
  seoDescription: null,
  faqs: [],
  category: { slug: "home-office", nameBn: "হোম ও অফিস সার্ভিস", kind: "SERVICE" },
};

describe("toPlainSummary", () => {
  it("strips markdown and collapses whitespace", () => {
    expect(toPlainSummary("## শিরোনাম\n\nবগুড়ার **সব** কাজ। [লিংক](https://x)")).toBe(
      "শিরোনাম বগুড়ার সব কাজ। লিংক",
    );
  });

  it("trims to 155 characters with an ellipsis", () => {
    const summary = toPlainSummary("ক".repeat(400));
    expect(summary).toHaveLength(155);
    expect(summary.endsWith("…")).toBe(true);
  });
});

describe("catalogMetadata", () => {
  it("builds a Bogura title, canonical and Bangla OG for a category", () => {
    expect(catalogMetadata({ type: "category", category })).toMatchObject({
      title: "হোম ও অফিস সার্ভিস — বগুড়া",
      description: "ঘরের সব কাজ",
      alternates: { canonical: "/services/home-office" },
      openGraph: { locale: "bn_BD", siteName: "আমার বগুড়া", url: "/services/home-office" },
    });
  });

  it("uses the description summary for a service", () => {
    expect(catalogMetadata({ type: "service", service })).toMatchObject({
      title: "ইলেকট্রিশিয়ান — বগুড়া",
      description: "বগুড়ায় ইলেকট্রিক কাজ।",
      alternates: { canonical: "/services/electrician" },
    });
  });

  it("prefers admin SEO fields", () => {
    expect(
      catalogMetadata({
        type: "service",
        service: { ...service, seoTitle: "T", seoDescription: "D" },
      }),
    ).toMatchObject({ title: "T", description: "D" });
  });

  it("points the ambulance canonical at its dedicated page", () => {
    expect(
      catalogMetadata({ type: "service", service: { ...service, slug: "ambulance" } }).alternates,
    ).toEqual({ canonical: "/emergency/ambulance" });
  });
});
