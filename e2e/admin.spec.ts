// P8 admin core, end to end against the DEV server (needs the DB and the console SMS outbox).
// A throwaway operator with a known TOTP secret is created by scripts/e2e-admin.ts. Requests are
// created through the operator's phone-call form, so this spec never depends on Turnstile.
// Run: E2E_BASE_URL=http://localhost:3000 pnpm e2e admin --project=desktop-chrome
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";

import { type BrowserContext, expect, type Page, test } from "@playwright/test";

import {
  auditActions,
  cleanupPhones,
  latestOtp,
  requestRow,
  resetLocalRateLimits,
  testPhone,
  waitForHydration,
} from "./support/test-data";

test.describe.configure({ mode: "serial", timeout: 180_000 });
test.skip(({ isMobile }) => isMobile, "one project is enough for DB-backed flows");

const operator = {
  email: `op-${Date.now()}@e2e.amarbogura.invalid`,
  password: `E2e-${Math.random().toString(36).slice(2)}-pass`,
  secret: "",
};
const guest = testPhone();
const caller = testPhone();
const codes: { guest?: string; phone?: string } = {};
/** One signed-in operator tab shared by the serial tests (a TOTP code is valid for 30 s). */
let adminContext: BrowserContext;
let admin: Page;

const helper = (...args: string[]) =>
  execFileSync("pnpm", ["exec", "tsx", "scripts/e2e-admin.ts", ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

test.beforeAll(async ({ browser, request }) => {
  test.setTimeout(180_000);
  const probe = await request.get("/dev/forms");
  test.skip(probe.status() === 404, "needs the dev server (console SMS outbox)");
  await resetLocalRateLimits();
  const created = JSON.parse(
    helper("create", operator.email, operator.password).trim().split("\n").at(-1)!,
  );
  operator.secret = created.secret;
  adminContext = await browser.newContext({ locale: "bn-BD", timezoneId: "Asia/Dhaka" });
  admin = await adminContext.newPage();
  await adminLogin(admin);
});

test.afterAll(async () => {
  await adminContext?.close();
  await cleanupPhones([guest.e164, caller.e164]).catch(() => undefined);
  if (operator.secret) helper("delete", operator.email);
});

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits) keyed with the secret's UTF-8 bytes, like Better Auth. */
function totp(secret: string, at = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const mac = createHmac("sha1", Buffer.from(secret)).update(counter).digest();
  const offset = mac[mac.length - 1]! & 15;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** Waits until React has attached its props to `selector` (clicking earlier submits natively). */
async function waitForReact(page: Page, selector: string) {
  await page.waitForFunction((css) => {
    const el = document.querySelector(css);
    return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  }, selector);
}

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await waitForReact(page, "#email");
  await page.getByLabel("ইমেইল").fill(operator.email);
  await page.getByLabel("পাসওয়ার্ড").fill(operator.password);
  await page.getByRole("button", { name: "লগইন" }).click();
  const otp = page.getByRole("textbox", { name: "৬ সংখ্যার কোড" });
  await otp.waitFor();
  // Don't type a code that expires mid-request.
  if (Date.now() % 30_000 > 26_000) await page.waitForTimeout(30_000 - (Date.now() % 30_000) + 500);
  await otp.fill(totp(operator.secret));
  await page.getByRole("button", { name: "যাচাই করুন" }).click();
  await page.waitForURL((url) => url.pathname === "/admin", { timeout: 60_000 });
}

const nextStep = (page: Page) => page.getByRole("button", { name: /পরের ধাপ/ }).click();

async function fillCustomRequest(page: Page, phone: string, description: string) {
  await page.getByLabel(/বিস্তারিত লিখুন/).fill(description);
  await nextStep(page);
  await page.getByLabel(/এক লাইনে কী দরকার/).fill("পুরাতন খাট মেরামত");
  await page.getByLabel(/আপনার নাম/).fill("করিম মিয়া");
  await page.getByLabel(/^মোবাইল নম্বর/).fill(phone);
  await page
    .getByLabel(/^এলাকা/)
    .first()
    .selectOption({ label: "বগুড়া সদর" });
  await page.getByLabel("এলাকা", { exact: true }).last().selectOption({ label: "সাতমাথা" });
  await page.getByLabel(/বিস্তারিত ঠিকানা/).fill("বাসা ৭, সাতমাথা");
}

/**
 * Clicks an admin action button, then waits until its audit row exists (the "saved" message stays
 * on screen between actions, so it can't tell one save from the next).
 */
async function act(page: Page, name: string, requestId: string, audits: number) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect.poll(async () => (await auditActions(requestId)).length).toBe(audits);
  await expect(page.getByRole("button", { name: "নোট যোগ করুন" })).toBeVisible();
}

/** Operator creates a custom request for a caller; returns its code (lands on the detail page). */
async function createPhoneRequest(page: Page, phone: string, description: string) {
  await page.goto("/admin/requests/new?service=custom");
  await waitForReact(page, "form textarea");
  await fillCustomRequest(page, phone, description);
  await page.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }).click();
  await page.waitForURL(/\/admin\/requests\/AB-\d{6}-\d{4,}$/, { timeout: 30_000 });
  await waitForReact(page, "#admin-message");
  return page.url().split("/").at(-1)!;
}

test("operator records a guest's phone call as a request", async () => {
  await expect(admin.getByRole("heading", { level: 1, name: "ওভারভিউ" })).toBeVisible();
  codes.guest = await createPhoneRequest(
    admin,
    guest.local,
    "খাটের একটি পা ভেঙে গেছে, মেরামত করতে হবে।",
  );
  await expect(admin.getByText("ফোন কল").first()).toBeVisible();
  const row = await requestRow(codes.guest);
  // No account owns this number → a guest request, trackable by OTP.
  expect(row).toMatchObject({ source: "PHONE", status: "NEW", userId: null });
  expect(await auditActions(row.id)).toEqual(["request.create_phone"]);
});

test("operator takes the request through its whole lifecycle", async () => {
  const page = admin;
  await page.goto("/admin");

  // "New" view → the request → detail page.
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /^রিকোয়েস্ট/ })
    .first()
    .click();
  await page.getByRole("link", { name: "নতুন", exact: true }).click();
  await page.getByRole("link", { name: codes.guest! }).first().click();
  await page.waitForURL(new RegExp(`/admin/requests/${codes.guest}$`));
  await waitForReact(page, "#admin-message");
  const { id } = await requestRow(codes.guest!);

  await act(page, "যাচাই চলছে করুন", id, 2);

  await page.getByLabel("বার্তা").fill("গ্রাহককে ফোন করা হয়েছে, ধরেননি");
  await page.getByLabel("শুধু অ্যাডমিনরা দেখবেন").check();
  await act(page, "নোট যোগ করুন", id, 3);

  await page.getByLabel("বার্তা").fill("মিস্ত্রি কাল সকালে আসবেন");
  await page.getByLabel("গ্রাহক দেখতে পাবেন").check();
  await act(page, "কাজ চলছে করুন", id, 4);

  await page.getByLabel("আনুমানিক খরচ (টাকা)").fill("১২০০");
  await act(page, "খরচ জানান", id, 5);

  await act(page, "আমাকে দিন", id, 6);
  await act(page, "সম্পন্ন করুন", id, 7);
  await expect(page.getByText("রিকোয়েস্টটি বন্ধ; আর স্ট্যাটাস বদলানো যাবে না।")).toBeVisible();
  await expect(page.getByText("অভ্যন্তরীণ").first()).toBeVisible();

  expect(await requestRow(codes.guest!)).toMatchObject({ status: "COMPLETED", quotedAmount: 1200 });
  expect(await auditActions(id)).toEqual([
    "request.create_phone",
    "request.status",
    "request.note",
    "request.status",
    "request.quote",
    "request.assign",
    "request.status",
  ]);
});

test("the guest's timeline shows customer-visible steps only", async ({ page }) => {
  await page.goto(`/track?code=${codes.guest}`);
  await waitForHydration(page);
  await page.getByLabel("যে নম্বর দিয়ে রিকোয়েস্ট করেছিলেন").fill(guest.local);
  const sentAfter = Date.now();
  await page.getByRole("button", { name: "কোড পাঠান" }).click();
  await page
    .getByRole("textbox", { name: "৬ সংখ্যার কোড" })
    .fill(await latestOtp(guest.e164, sentAfter));
  await page.waitForURL(new RegExp(`/track/${codes.guest}$`));

  await expect(page.getByText("মিস্ত্রি কাল সকালে আসবেন")).toBeVisible();
  await expect(page.getByText("আনুমানিক খরচ ৳১,২০০")).toBeVisible();
  await expect(page.getByText("সম্পন্ন").first()).toBeVisible();
  await expect(page.getByText("গ্রাহককে ফোন করা হয়েছে, ধরেননি")).toHaveCount(0);
});

test("operator flags spam, blocks the number and exports CSV", async () => {
  const page = admin;
  codes.phone = await createPhoneRequest(
    page,
    caller.local,
    "ফোনে জানালেন: আলমারির দরজা খুলে পড়ে গেছে।",
  );
  const row = await requestRow(codes.phone);
  expect(row).toMatchObject({ source: "PHONE", status: "NEW" });

  await act(page, "স্প্যাম হিসেবে চিহ্নিত করুন", row.id, 2);
  expect(await auditActions(row.id)).toEqual(["request.create_phone", "request.spam"]);
  expect((await requestRow(codes.phone)).isSpam).toBe(true);

  await page.getByText("নম্বর ব্লক করুন").first().click();
  await page.getByLabel("ব্লকের কারণ").fill("বারবার ভুয়া কল");
  await page.getByRole("button", { name: "নম্বর ব্লক করুন", exact: true }).click();
  await expect(page.getByText("এই নম্বর ব্লক করা আছে")).toBeVisible();

  // Spam is hidden by default; the Spam view shows it, and its CSV contains it.
  await page.goto("/admin/requests");
  await expect(page.getByRole("link", { name: codes.phone })).toHaveCount(0);
  await page.getByRole("link", { name: "স্প্যাম", exact: true }).click();
  await expect(page.getByRole("link", { name: codes.phone }).first()).toBeVisible();
  await waitForReact(page, "main button");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV ডাউনলোড" }).click();
  const file = await (await download).path();
  const { readFile } = await import("node:fs/promises");
  const csv = await readFile(file, "utf8");
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv).toContain(codes.phone);
});

test("the admin panel works in English", async () => {
  const page = admin;
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await page.goto(`/en/admin/requests/${codes.guest}`);
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  await expect(page.getByText("Internal").first()).toBeVisible();
});
