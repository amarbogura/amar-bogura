import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { categories } from "../prisma/seed/data/catalog";

const serviceCategories = categories.filter((category) => category.kind === "SERVICE");
const services = serviceCategories
  .flatMap((category) => category.services ?? [])
  .filter((service) => service.slug !== "ambulance");

async function jsonLdTypes(page: Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((block) => {
    const data = JSON.parse(block) as { "@type": string } | Array<{ "@type": string }>;
    return (Array.isArray(data) ? data : [data]).map((item) => item["@type"]);
  });
}

// Only one project needs to crawl every page; the layout checks below run on both.
test.describe("every seeded catalog slug", () => {
  test.skip(({ isMobile }) => isMobile, "crawl once (desktop project)");

  for (const category of serviceCategories) {
    test(`category ${category.slug}`, async ({ page }) => {
      const response = await page.goto(`/services/${category.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(category.nameBn);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`/services/${category.slug}$`),
      );
      expect(await jsonLdTypes(page)).toEqual(
        expect.arrayContaining(["BreadcrumbList", "FAQPage"]),
      );
    });
  }

  for (const service of services) {
    test(`service ${service.slug}`, async ({ page }) => {
      const response = await page.goto(`/services/${service.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.nameBn);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`/services/${service.slug}$`),
      );
      expect(await jsonLdTypes(page)).toEqual(
        expect.arrayContaining(["BreadcrumbList", "Service", "FAQPage"]),
      );
      await expect(page.getByRole("link", { name: /রিকোয়েস্ট করুন/ }).first()).toHaveAttribute(
        "href",
        `/services/${service.slug}/request`,
      );
    });
  }
});

test("unknown slug is a 404", async ({ page }) => {
  const response = await page.goto("/services/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "পেজটি খুঁজে পাওয়া যায়নি" })).toBeVisible();
});

test("non-service categories and the ambulance redirect to their own pages", async ({
  request,
}) => {
  for (const [from, to] of [
    ["/services/buy-sell", "/buy-sell"],
    ["/services/property", "/property"],
    ["/services/custom-request", "/request/custom"],
    ["/services/ambulance", "/emergency/ambulance"],
  ]) {
    const response = await request.get(from!, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(response.headers()["location"], from).toBe(to);
  }
});

test("service page metadata", async ({ page }) => {
  await page.goto("/services/electrician");
  await expect(page).toHaveTitle("ইলেকট্রিশিয়ান — বগুড়া | আমার বগুড়া");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "bn_BD");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /বগুড়ায়/);
});

test.describe("ambulance page at 360px", () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });

  test("call button is above the fold and dials 999 until our number is set", async ({ page }) => {
    await page.goto("/emergency/ambulance");
    const call = page.getByRole("link", { name: /এখনই কল করুন/ });
    await expect(call).toHaveAttribute("href", "tel:999");
    const box = await call.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(640);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("জরুরি অ্যাম্বুলেন্স");
  });
});

test.describe("accessibility", () => {
  for (const path of ["/services/home-office", "/services/electrician", "/emergency/ambulance"]) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });
  }
});
