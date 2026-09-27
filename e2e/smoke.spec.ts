import { expect, test } from "@playwright/test";

/**
 * Pages linked from the shell that later phases build (P4 services, P7 requests, P9 buy-sell…).
 * Next prefetches them (`?_rsc=` fetches), which 404 until then — those alone are tolerated.
 */
const isFuturePagePrefetch = (url: string, resourceType: string) =>
  resourceType === "fetch" && url.includes("_rsc=");

test("home page renders in Bangla with security headers", async ({ page }) => {
  // A CSP that blocks Next.js scripts would only surface as console errors / failed resources.
  const consoleErrors: string[] = [];
  const brokenResources: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("status of 404")) {
      consoleErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if (response.status() >= 400 && !isFuturePagePrefetch(response.url(), type)) {
      brokenResources.push(`${response.status()} ${type} ${response.url()}`);
    }
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);
  expect(brokenResources).toEqual([]);

  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(
    page.getByRole("heading", { level: 1, name: "বগুড়ায় কী সার্ভিস খুঁজছেন?" }),
  ).toBeVisible();

  const headers = response!.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("unknown route shows the Bangla 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "পেজটি খুঁজে পাওয়া যায়নি" })).toBeVisible();
});
