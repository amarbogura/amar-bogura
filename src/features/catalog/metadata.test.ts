import { catalogMetadata, toPlainSummary } from "./metadata";
import type { CatalogCategory, CatalogService } from "./types";

const category: CatalogCategory = {
  id: "c1",
  slug: "home-office",
  kind: "SERVICE",
  name: "হোম ও অফিস সার্ভিস",
  nameBn: "হোম ও অফিস সার্ভিস",
  nameEn: "Home & Office Services",
  shortDesc: "ঘরের সব কাজ",
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
  name: "ইলেকট্রিশিয়ান",
  nameBn: "ইলেকট্রিশিয়ান",
  nameEn: "Electrician",
  shortDesc: "ওয়্যারিং",
  iconKey: "zap",
  startingPrice: null,
  isEmergency: false,
  description: "বগুড়ায় [ইলেকট্রিক](https://x.test) কাজ।",
  priceNote: null,
  seoTitle: null,
  seoDescription: null,
  faqs: [],
  category: { slug: "home-office", name: "হোম ও অফিস সার্ভিস", kind: "SERVICE" },
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
  it("builds a Bogura title, canonical, hreflang and Bangla OG for a category", () => {
    expect(catalogMetadata({ type: "category", category }, "bn")).toMatchObject({
      title: "হোম ও অফিস সার্ভিস — বগুড়া",
      description: "ঘরের সব কাজ",
      alternates: {
        canonical: "/services/home-office",
        languages: {
          "bn-BD": "/services/home-office",
          en: "/en/services/home-office",
          "x-default": "/services/home-office",
        },
      },
      openGraph: { locale: "bn_BD", siteName: "আমার বগুড়া", url: "/services/home-office" },
    });
  });

  it("uses the English site name, title pattern and URL on English pages", () => {
    const english = {
      ...service,
      name: "Electrician",
      description: "Electrical work in Bogura.",
    };
    expect(catalogMetadata({ type: "service", service: english }, "en")).toMatchObject({
      title: "Electrician — Bogura",
      alternates: { canonical: "/en/services/electrician" },
      openGraph: { locale: "en_US", siteName: "Amar Bogura", url: "/en/services/electrician" },
    });
  });

  it("uses the description summary for a service", () => {
    expect(catalogMetadata({ type: "service", service }, "bn")).toMatchObject({
      title: "ইলেকট্রিশিয়ান — বগুড়া",
      description: "বগুড়ায় ইলেকট্রিক কাজ।",
      alternates: { canonical: "/services/electrician" },
    });
  });

  it("prefers admin SEO fields", () => {
    expect(
      catalogMetadata(
        { type: "service", service: { ...service, seoTitle: "T", seoDescription: "D" } },
        "bn",
      ),
    ).toMatchObject({ title: "T", description: "D" });
  });

  it("points the ambulance canonical at its dedicated page", () => {
    expect(
      catalogMetadata({ type: "service", service: { ...service, slug: "ambulance" } }, "en")
        .alternates?.canonical,
    ).toBe("/en/emergency/ambulance");
  });
});
