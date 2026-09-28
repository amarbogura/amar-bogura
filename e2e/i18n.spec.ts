// P7.5 bilingual site (D-17): Bangla at /, English at /en, switcher, hreflang, translated content.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("language switching", () => {
  test("home switches to English and back, and the choice is remembered", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "বগুড়ায় কী সার্ভিস খুঁজছেন?",
    );

    await page.getByRole("link", { name: "Switch to English" }).first().click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "What service do you need in Bogura?",
    );
    // The 12 parent categories, in English.
    const categories = page.locator("#services li");
    await expect(categories).toHaveCount(12);
    await expect(page.getByRole("link", { name: "Home & Office Services" })).toBeVisible();

    // Remembered: the unprefixed URL now opens English.
    await page.goto("/services/ac-repair");
    await expect(page).toHaveURL(/\/en\/services\/ac-repair$/);

    // Back to Bangla on the SAME page.
    const toBangla = page.getByRole("link", { name: "বাংলায় দেখুন" }).first();
    await expect(toBangla).toHaveAttribute("href", "/services/ac-repair");
    await toBangla.click();
    await expect(page).toHaveURL(/\/services\/ac-repair$/);
    await expect(page).not.toHaveURL(/\/en\//);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("এসি সার্ভিসিং ও মেরামত");
    expect((await context.cookies()).find((c) => c.name === "ab_locale")?.value).toBe("bn");
  });
});

test("English service page: content, FAQs and hreflang", async ({ page }) => {
  await page.goto("/en/services/ac-repair");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AC Service & Repair");
  await expect(page.getByText("Is a gas refill part of this service?")).toBeVisible();
  await expect(page.getByRole("link", { name: "Request now" }).first()).toHaveAttribute(
    "href",
    "/en/services/ac-repair/request",
  );
  const alternates = page.locator('link[rel="alternate"][hreflang]');
  await expect(alternates).toHaveCount(3);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en\/services\/ac-repair$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="bn-BD"]')).toHaveAttribute(
    "href",
    /\/services\/ac-repair$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/en\/services\/ac-repair$/,
  );
});

test("/bn/… redirects to the one Bangla URL", async ({ page }) => {
  await page.goto("/bn/services/electrician");
  await expect(page).toHaveURL(/\/services\/electrician$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
});

test("English 404 and English login copy", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();

  await page.goto("/en/login");
  await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  await expect(page.getByLabel("Mobile number")).toBeVisible();
});

test("English home has no serious accessibility violations", async ({ page }) => {
  await page.goto("/en");
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(
    violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});
