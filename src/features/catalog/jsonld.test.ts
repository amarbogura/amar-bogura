import { breadcrumbJsonLd, faqJsonLd, serializeJsonLd, serviceJsonLd } from "./jsonld";

const SITE = "https://amarbogura.com";
const service = {
  slug: "electrician",
  name: "ইলেকট্রিশিয়ান",
  nameBn: "ইলেকট্রিশিয়ান",
  nameEn: "Electrician",
  shortDesc: "ওয়্যারিং ও সুইচ-সকেট",
  startingPrice: null as number | null,
  category: { name: "হোম ও অফিস সার্ভিস" },
};
const BN = { locale: "bn" as const, siteName: "আমার বগুড়া", startingPriceLabel: "শুরুর মূল্য" };

describe("breadcrumbJsonLd", () => {
  it("numbers items from 1 with absolute URLs", () => {
    expect(
      breadcrumbJsonLd(
        [
          { name: "হোম", path: "/" },
          { name: "ইলেকট্রিশিয়ান", path: "/services/electrician" },
        ],
        SITE,
      ),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: "https://amarbogura.com/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "ইলেকট্রিশিয়ান",
          item: "https://amarbogura.com/services/electrician",
        },
      ],
    });
  });
});

describe("serviceJsonLd", () => {
  it("serves Bogura and has no offer without a price", () => {
    const data = serviceJsonLd(service, "/services/electrician", SITE, BN);
    expect(data).toMatchObject({
      "@type": "Service",
      inLanguage: "bn-BD",
      name: "ইলেকট্রিশিয়ান",
      alternateName: "Electrician",
      url: "https://amarbogura.com/services/electrician",
      areaServed: [
        expect.objectContaining({ name: "Bogura" }),
        expect.objectContaining({ name: "Bogura District" }),
      ],
    });
    expect(data).not.toHaveProperty("offers");
  });

  it("adds a BDT offer when a starting price is set", () => {
    expect(serviceJsonLd({ ...service, startingPrice: 500 }, "/x", SITE, BN)).toMatchObject({
      offers: { "@type": "Offer", priceCurrency: "BDT", price: 500 },
    });
  });

  it("uses the English name with the Bangla one as alternateName on English pages", () => {
    const english = { ...service, name: "Electrician", category: { name: "Home & Office" } };
    expect(
      serviceJsonLd(english, "/en/services/electrician", SITE, {
        locale: "en",
        siteName: "Amar Bogura",
        startingPriceLabel: "Starting price",
      }),
    ).toMatchObject({
      inLanguage: "en",
      name: "Electrician",
      alternateName: "ইলেকট্রিশিয়ান",
      provider: { name: "Amar Bogura" },
    });
  });
});

describe("faqJsonLd", () => {
  it("is null without FAQs", () => {
    expect(faqJsonLd([])).toBeNull();
  });

  it("maps questions and answers", () => {
    expect(faqJsonLd([{ q: "প্রশ্ন?", a: "উত্তর।" }])).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "প্রশ্ন?", acceptedAnswer: { text: "উত্তর।" } }],
    });
  });
});

describe("serializeJsonLd", () => {
  it("cannot be broken out of with </script> or HTML comments, and round-trips", () => {
    const hostile = `</script><script>alert(1)</script><!-- & ${String.fromCharCode(0x2028)}`;
    const out = serializeJsonLd({ text: hostile });
    expect(out).not.toMatch(/[<>&]/);
    expect(out).not.toContain(String.fromCharCode(0x2028));
    expect(JSON.parse(out)).toEqual({ text: hostile });
  });
});
