import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows exactly the 12 parent categories, never sub-services", async ({ page }) => {
    const grid = page.locator("#services");
    await expect(grid.getByRole("link")).toHaveCount(12);
    await expect(grid.getByRole("link", { name: "হোম ও অফিস সার্ভিস" })).toHaveAttribute(
      "href",
      "/services/home-office",
    );
    await expect(grid.getByRole("link", { name: "বাই অ্যান্ড সেল" })).toHaveAttribute(
      "href",
      "/buy-sell",
    );
    await expect(grid.getByRole("link", { name: "ইলেকট্রিশিয়ান" })).toHaveCount(0);
  });

  test("has the emergency ambulance quick action and the ProTutors block", async ({ page }) => {
    await expect(page.getByRole("link", { name: /জরুরি অ্যাম্বুলেন্স/ }).first()).toHaveAttribute(
      "href",
      "/emergency/ambulance",
    );
    await expect(page.getByRole("link", { name: "টিউটর রিকোয়েস্ট করুন" })).toHaveAttribute(
      "href",
      "/services/home-tutor",
    );
  });

  test("hero search submits to /search?q=", async ({ page }) => {
    await page.getByLabel("সার্ভিস খুঁজুন").fill("এসি");
    await page.getByLabel("সার্ভিস খুঁজুন").press("Enter");
    await expect(page).toHaveURL(/\/search\?q=%E0%A6%8F%E0%A6%B8%E0%A6%BF$/);
  });

  test("has no serious or critical accessibility violations", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});

test.describe("mobile shell (360px)", () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

  test("shows the bottom nav and emergency chip without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "নিচের মেনু" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(5);
    await expect(nav.getByRole("link", { name: "হোম" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "রিকোয়েস্ট" })).toHaveAttribute("href", "/track");
    await expect(page.getByRole("link", { name: "জরুরি অ্যাম্বুলেন্স" }).last()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});

test.describe("desktop shell", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false });

  test("hides the bottom nav and shows the main menu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "নিচের মেনু" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "প্রধান মেনু" })).toBeVisible();
  });
});
