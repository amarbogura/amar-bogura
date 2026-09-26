import { expect, test } from "@playwright/test";

test("home page renders in Bangla with security headers", async ({ page }) => {
  // A CSP that blocks Next.js scripts would only surface as console errors.
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");
  expect(consoleErrors).toEqual([]);

  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(page.getByRole("heading", { level: 1, name: "আমার বগুড়া" })).toBeVisible();
  await expect(page.getByText("৳১,২০০")).toBeVisible();

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
