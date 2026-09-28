// P7 request flows, end to end against the DEV server (needs the DB, the console SMS outbox and
// Cloudflare's Turnstile test keys). Skips itself on the production build used by `pnpm e2e`.
// Run: E2E_BASE_URL=http://localhost:3000 pnpm e2e requests --project=desktop-chrome
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { cleanupPhones, latestOtp, resetLocalRateLimits, testPhone } from "./support/test-data";

// Dev server compiles each route on first visit.
test.describe.configure({ mode: "serial", timeout: 120_000 });

const guest = testPhone();
const member = testPhone();
const codes: { truck?: string; ambulance?: string } = {};

test.beforeAll(async ({ request }) => {
  const probe = await request.get("/dev/forms");
  test.skip(probe.status() === 404, "needs the dev server (console SMS outbox)");
  await resetLocalRateLimits();
});

test.afterAll(async () => {
  await cleanupPhones([guest.e164, member.e164]).catch(() => undefined);
});

test.skip(({ isMobile }) => isMobile, "one project is enough for DB-backed flows");

/** Tomorrow's date in Dhaka as YYYY-MM-DD. */
function tomorrowDhaka(): string {
  return new Date(Date.now() + 30 * 3600_000).toISOString().slice(0, 10);
}

const nextStep = (page: Page) => page.getByRole("button", { name: /পরের ধাপ/ }).click();

async function submitAndGetCode(page: Page, button: string | RegExp): Promise<string> {
  await page.getByRole("button", { name: button }).click();
  await page.waitForURL(/\/request\/success\//, { timeout: 30_000 });
  const code = (await page.getByTestId("request-code").textContent())!.trim();
  expect(code).toMatch(/^AB-\d{6}-\d{4,}$/);
  return code;
}

async function loginWithPhone(page: Page, phone: { local: string; e164: string }, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  const sentAfter = Date.now();
  await page.getByLabel("মোবাইল নম্বর").fill(phone.local);
  await page.getByRole("button", { name: "কোড পাঠান" }).click();
  const otp = await latestOtp(phone.e164, sentAfter);
  await page.getByRole("textbox", { name: "৬ সংখ্যার কোড" }).fill(otp);
  const nameInput = page.getByLabel("আপনার নাম");
  const arrived = (url: URL) => url.pathname === next.split("?")[0];
  // A first login asks for a name before redirecting; a returning user goes straight to `next`.
  const asksName = await Promise.race([
    nameInput.waitFor({ state: "visible", timeout: 30_000 }).then(() => true),
    page.waitForURL(arrived, { timeout: 30_000 }).then(() => false),
  ]);
  if (asksName) {
    await nameInput.fill("পরীক্ষা ব্যবহারকারী");
    await page.getByRole("button", { name: "চালিয়ে যান" }).click();
  }
  await page.waitForURL(arrived, { timeout: 30_000 });
}

test("guest: truck rental request without login", async ({ page }) => {
  await page.goto("/services/rent-a-truck/request");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ট্রাক ভাড়া");
  await expect(page.getByText("লগইন করলে রিকোয়েস্ট ট্র্যাক করা সহজ")).toBeVisible();
  // vehicleType is pinned by the service → never shown.
  await expect(page.getByLabel("গাড়ির ধরন")).toHaveCount(0);

  await page.getByLabel("শুধু যাওয়া").check();
  await page.getByLabel("কোথা থেকে — উপজেলা / এলাকা").selectOption({ label: "বগুড়া সদর" });
  await page.getByLabel("এলাকা", { exact: true }).first().selectOption({ label: "সাতমাথা" });
  await page.getByLabel("কোথা থেকে — ঠিকানা").fill("সাতমাথা মোড়");
  await page.getByLabel("কোথায় — উপজেলা / এলাকা").selectOption({ label: "বগুড়ার বাইরে" });
  await page.getByLabel("কোথায় — ঠিকানা").fill("ঢাকা, মিরপুর ১০");
  await page.getByLabel("তারিখ", { exact: true }).fill(tomorrowDhaka());
  await page.getByLabel("সময়", { exact: true }).fill("09:30");
  await nextStep(page);
  await page.getByLabel(/কী মালামাল নেবেন/).fill("১০ বস্তা চাল");
  await nextStep(page);
  await page.getByLabel(/আপনার নাম/).fill("রহিম উদ্দিন");
  await page.getByLabel(/^মোবাইল নম্বর/).fill(guest.local);

  const axe = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual(
    [],
  );

  codes.truck = await submitAndGetCode(page, "রিকোয়েস্ট পাঠান");
  await expect(
    page.getByRole("heading", { level: 1, name: "রিকোয়েস্ট জমা হয়েছে!" }),
  ).toBeVisible();
  const axeSuccess = await new AxeBuilder({ page }).include("main").analyze();
  expect(
    axeSuccess.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? "")),
  ).toEqual([]);
});

test("guest: ambulance request keeps Call-now on top", async ({ page }) => {
  await page.goto("/services/ambulance/request");
  await expect(page.getByRole("link", { name: /এখনই কল করুন/ })).toBeVisible();
  await page.getByLabel("নন-এসি").check();
  await page.getByLabel("কোথা থেকে — উপজেলা / এলাকা").selectOption({ label: "শেরপুর" });
  await page.getByLabel("কোথা থেকে — ঠিকানা").fill("শেরপুর বাসস্ট্যান্ড");
  await page.getByLabel("কোথায় — উপজেলা / এলাকা").selectOption({ label: "বগুড়া সদর" });
  await page.getByLabel("এলাকা", { exact: true }).last().selectOption({ index: 1 });
  await page.getByLabel("কোথায় — ঠিকানা").fill("শহীদ জিয়াউর রহমান মেডিকেল কলেজ হাসপাতাল");
  await nextStep(page);
  await page.getByLabel(/আপনার নাম/).fill("রহিম উদ্দিন");
  await page.getByLabel(/^মোবাইল নম্বর/).fill(guest.local);
  codes.ambulance = await submitAndGetCode(page, "অ্যাম্বুলেন্স চাই");
});

test("guest: /track with code + OTP, then cancel", async ({ page }) => {
  await page.goto("/track");
  await page.getByLabel("রিকোয়েস্ট কোড").fill(codes.truck!.toLowerCase());
  await page.getByLabel("যে নম্বর দিয়ে রিকোয়েস্ট করেছিলেন").fill(guest.local);
  const sentAfter = Date.now();
  await page.getByRole("button", { name: "কোড পাঠান" }).click();
  const otp = await latestOtp(guest.e164, sentAfter);
  await page.getByRole("textbox", { name: "৬ সংখ্যার কোড" }).fill(otp);

  await page.waitForURL(new RegExp(`/track/${codes.truck}$`));
  await expect(page.getByRole("heading", { level: 1, name: "ট্রাক ভাড়া" })).toBeVisible();
  await expect(page.getByText("নতুন", { exact: true })).toBeVisible();
  await expect(page.getByText("ঢাকা, মিরপুর ১০")).toBeVisible();

  await page.getByRole("button", { name: "রিকোয়েস্ট বাতিল করুন" }).click();
  await page.getByRole("button", { name: "হ্যাঁ, বাতিল করুন" }).click();
  await expect(page.getByText("বাতিল করা হয়েছে").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "রিকোয়েস্ট বাতিল করুন" })).toHaveCount(0);
});

test("a stranger can't open someone else's request", async ({ page }) => {
  // No track cookie → back to the verification form, code kept.
  await page.goto(`/track/${codes.ambulance}`);
  await expect(page).toHaveURL(/\/track\?code=/);
  await expect(page.getByLabel("রিকোয়েস্ট কোড")).toHaveValue(codes.ambulance!);
});

test("guest logs in with the same phone and sees both requests", async ({ page }) => {
  await loginWithPhone(page, guest, "/account/requests");
  await expect(page.getByRole("heading", { level: 1, name: "আমার রিকোয়েস্ট" })).toBeVisible();
  await expect(page.getByText(codes.truck!)).toBeVisible();
  await expect(page.getByText(codes.ambulance!)).toBeVisible();

  await page.getByRole("link", { name: "বাতিল", exact: true }).click();
  await expect(page.getByText(codes.truck!)).toBeVisible();
  await expect(page.getByText(codes.ambulance!)).toHaveCount(0);
});

test("logged-in user submits AC repair with prefilled contact", async ({ page }) => {
  await loginWithPhone(page, member, "/services/ac-repair/request");
  await expect(page.getByText("লগইন করলে রিকোয়েস্ট ট্র্যাক করা সহজ")).toHaveCount(0);
  await page.getByLabel("স্প্লিট").check();
  await page.getByLabel(/ক্ষমতা/).selectOption("1.5");
  await nextStep(page);
  await page.getByLabel(/কী সমস্যা হচ্ছে/).fill("ঠান্ডা হচ্ছে না");
  await nextStep(page);
  await expect(page.getByLabel(/^মোবাইল নম্বর/)).toHaveValue(member.local);
  await page
    .getByLabel(/^এলাকা/)
    .first()
    .selectOption({ label: "বগুড়া সদর" });
  await page.getByLabel("এলাকা", { exact: true }).last().selectOption({ label: "সাতমাথা" });
  await page.getByLabel(/বিস্তারিত ঠিকানা/).fill("বাসা ১২, সাতমাথা");
  await page.getByLabel("কবে দরকার").fill(tomorrowDhaka());
  await page.getByLabel("যেকোনো সময়").check();
  const code = await submitAndGetCode(page, "রিকোয়েস্ট পাঠান");

  await page.goto("/account/requests");
  await page.getByRole("link", { name: new RegExp(code) }).click();
  await page.waitForURL(new RegExp(`/account/requests/${code}$`), { timeout: 60_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "এসি সার্ভিসিং ও মেরামত" }),
  ).toBeVisible();
  await expect(page.getByText("ঠান্ডা হচ্ছে না")).toBeVisible();
});
