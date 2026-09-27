// P6 form engine on /dev/forms (dev server only — the page 404s in production, so this suite
// skips itself under `pnpm e2e`). Run: E2E_BASE_URL=http://localhost:3000 pnpm e2e forms
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { formTemplates } from "../src/features/forms/templates";

test.beforeEach(async ({ request }) => {
  const probe = await request.get("/dev/forms");
  test.skip(probe.status() === 404, "/dev/forms exists only in development");
});

/** Tomorrow's date in Dhaka as YYYY-MM-DD. */
function tomorrowDhaka(): string {
  const dhaka = new Date(Date.now() + 6 * 3600_000 + 24 * 3600_000);
  return dhaka.toISOString().slice(0, 10);
}

async function nextStep(page: Page) {
  await page.getByRole("button", { name: /পরের ধাপ/ }).click();
}

async function fillContact(page: Page) {
  await page.getByLabel(/আপনার নাম/).fill("রহিম উদ্দিন");
  await page.getByLabel(/^মোবাইল নম্বর/).fill("01712-345678");
}

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "run the crawl once");

  test("every template renders without console errors", async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("status of 404"))
        errors.push(message.text());
    });
    for (const template of formTemplates) {
      await page.goto(`/dev/forms/${template.key}`);
      await expect(page.getByRole("heading", { level: 1, name: template.name })).toBeVisible();
      await expect(page.getByText(/^ধাপ ১\//)).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("AC installation preset hides the variant and shows install questions", async ({ page }) => {
    await page.goto("/dev/forms/ac_service");
    await page.getByLabel("সার্ভিস (presets)").selectOption({ label: "এসি ইনস্টলেশন 📌" });
    await expect(page.getByLabel("কী সার্ভিস দরকার")).toHaveCount(0);
    await page.getByLabel("স্প্লিট").check();
    await page.getByLabel(/ক্ষমতা/).selectOption("1.5");
    await nextStep(page);
    await expect(page.getByText("ইনস্টলেশনের ধরন")).toBeVisible();
    await expect(page.getByLabel(/কী সমস্যা হচ্ছে/)).toHaveCount(0);
  });

  test("an invalid step shows the error summary", async ({ page }) => {
    await page.goto("/dev/forms/electrician");
    await nextStep(page);
    const summary = page.getByRole("alert").filter({ hasText: "এগোনোর আগে এগুলো ঠিক করুন" });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("link", { name: "কাজের ধরন" })).toBeVisible();
  });

  test("truck rental: fill and submit end to end, validated in server mode", async ({ page }) => {
    await page.goto("/dev/forms/vehicle_rent");
    await page.getByLabel("সার্ভিস (presets)").selectOption({ label: "ট্রাক ভাড়া 📌" });
    await page.getByLabel("শুধু যাওয়া").check();
    await page.getByLabel("কোথা থেকে — উপজেলা / এলাকা").selectOption({ label: "বগুড়া সদর" });
    await page.getByLabel("এলাকা", { exact: true }).first().selectOption({ label: "সাতমাথা" });
    await page.getByLabel("কোথা থেকে — ঠিকানা").fill("সাতমাথা মোড়");
    await page.getByLabel("কোথায় — উপজেলা / এলাকা").selectOption({ label: "বগুড়ার বাইরে" });
    await page.getByLabel("কোথায় — ঠিকানা").fill("ঢাকা, মিরপুর ১০");
    await page.getByLabel("তারিখ", { exact: true }).fill(tomorrowDhaka());
    await page.getByLabel("সময়", { exact: true }).fill("09:30");
    await nextStep(page);
    await page.getByLabel(/কী মালামাল নেবেন/).fill("১০ বস্তা চাল ও একটি ফ্রিজ");
    await page.getByLabel(/ট্রাকের সাইজ/).selectOption("3t");
    await nextStep(page);
    await fillContact(page);
    await page.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }).click();

    await expect(page.getByTestId("server-result")).toHaveText(/সফল/);
    const json = JSON.parse((await page.getByTestId("server-json").textContent())!);
    expect(json.common).toEqual({ contactName: "রহিম উদ্দিন", contactPhone: "+8801712345678" });
    expect(json.details).toMatchObject({
      vehicleType: "truck", // pinned by the service
      tripType: "one_way",
      goods: "১০ বস্তা চাল ও একটি ফ্রিজ",
      truckSize: "3t",
      route: { to: { areaId: null, address: "ঢাকা, মিরপুর ১০" } },
      startAt: `${tomorrowDhaka()}T09:30`,
    });
    expect(json.details).not.toHaveProperty("passengers");
    await expect(page.getByTestId("summary")).toContainText("ট্রাক");
  });

  test("courier: person + address fields and conditional cash amount", async ({ page }) => {
    await page.goto("/dev/forms/courier");
    await page
      .getByLabel("সার্ভিস (presets)")
      .selectOption({ label: "দোকান থেকে বাসায় ডেলিভারি" });
    await page.getByLabel("ছোট পার্সেল").check();
    await nextStep(page);
    await page.getByLabel(/প্রেরকের নাম ও ফোন — নাম/).fill("করিম স্টোর");
    await page.getByLabel(/প্রেরকের নাম ও ফোন — মোবাইল/).fill("01812345678");
    await page.getByLabel("উপজেলা / এলাকা").selectOption({ label: "শেরপুর" });
    await page.getByLabel("বাসা / রাস্তা / বিস্তারিত ঠিকানা").fill("বাজার রোড, শেরপুর");
    await page.getByLabel("তারিখ", { exact: true }).fill(tomorrowDhaka());
    await page.getByLabel("সময়", { exact: true }).fill("11:00");
    await nextStep(page);
    await page.getByLabel(/প্রাপকের নাম ও ফোন — নাম/).fill("সালমা");
    await page.getByLabel(/প্রাপকের নাম ও ফোন — মোবাইল/).fill("01912345678");
    await page.getByLabel("উপজেলা / এলাকা").selectOption({ label: "বগুড়া সদর" });
    await page.getByLabel("বাসা / রাস্তা / বিস্তারিত ঠিকানা").fill("মালতীনগর, বাসা ৫");
    // collectCash is pre-ticked by the service preset → amount is required.
    await expect(page.getByLabel(/কত টাকা তুলতে হবে/)).toBeVisible();
    await page.getByLabel(/কত টাকা তুলতে হবে/).fill("১,৫০০");
    await nextStep(page);
    await fillContact(page);
    await page.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }).click();

    await expect(page.getByTestId("server-result")).toHaveText(/সফল/);
    const json = JSON.parse((await page.getByTestId("server-json").textContent())!);
    expect(json.details).toMatchObject({
      itemType: "small_parcel",
      sender: { name: "করিম স্টোর", phone: "+8801812345678" },
      recipient: { name: "সালমা", phone: "+8801912345678" },
      collectCash: true,
      cashAmount: 1500,
    });
  });

  test("no serious accessibility violations on a form step", async ({ page }) => {
    await page.goto("/dev/forms/home_shifting");
    await expect(page.getByText(/^ধাপ ১\//)).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .include("form")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
