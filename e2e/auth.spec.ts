import { expect, test } from "@playwright/test";

test("logged-out /account redirects to phone login with next", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  await expect(page.getByRole("heading", { level: 1, name: "লগইন করুন" })).toBeVisible();
  await expect(page.getByLabel("মোবাইল নম্বর")).toBeVisible();
  await expect(page.getByRole("button", { name: "Google দিয়ে লগইন" })).toBeVisible();
});

test("logged-out /admin redirects to the admin login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { level: 1, name: "অ্যাডমিন লগইন" })).toBeVisible();
  await expect(page.getByLabel("ইমেইল")).toBeVisible();
});

test("phone login validates Bangladeshi numbers in Bangla", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("মোবাইল নম্বর").fill("01212345678");
  await page.getByRole("button", { name: "কোড পাঠান" }).click();
  await expect(page.getByText("সঠিক মোবাইল নম্বর দিন")).toBeVisible();
});

test("auth pages are not indexed", async ({ page }) => {
  for (const path of ["/login", "/admin/login"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});
