import { breadcrumbJsonLd, faqJsonLd, serializeJsonLd, serviceJsonLd } from "./jsonld";

const SITE = "https://amarbogura.com";
const service = {
  slug: "electrician",
  nameBn: "ইলেকট্রিশিয়ান",
  nameEn: "Electrician",
  shortDescBn: "ওয়্যারিং ও সুইচ-সকেট",
  startingPrice: null as number | null,
  category: { nameBn: "হোম ও অফিস সার্ভিস" },
};

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
    const data = serviceJsonLd(service, "/services/electrician", SITE);
    expect(data).toMatchObject({
      "@type": "Service",
      name: "ইলেকট্রিশিয়ান",
      url: "https://amarbogura.com/services/electrician",
      areaServed: [
        expect.objectContaining({ name: "Bogura" }),
        expect.objectContaining({ name: "Bogura District" }),
      ],
    });
    expect(data).not.toHaveProperty("offers");
  });

  it("adds a BDT offer when a starting price is set", () => {
    expect(serviceJsonLd({ ...service, startingPrice: 500 }, "/x", SITE)).toMatchObject({
      offers: { "@type": "Offer", priceCurrency: "BDT", price: 500 },
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
