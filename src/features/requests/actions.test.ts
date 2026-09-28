import type { FormSchema } from "@/features/forms/types";
import type * as SmsModule from "@/lib/sms";

const m = vi.hoisted(() => {
  const tx = {
    serviceRequest: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    requestEvent: { create: vi.fn() },
    requestAttachment: { createMany: vi.fn() },
    mediaAsset: { findMany: vi.fn(), updateMany: vi.fn() },
  };
  return {
    tx,
    db: {
      serviceRequest: { findFirst: vi.fn(), findUnique: vi.fn() },
      blockedPhone: { count: vi.fn() },
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
    },
    getSession: vi.fn(),
    rateLimit: vi.fn(),
    verifyTurnstile: vi.fn(),
    resolveServiceRequestForm: vi.fn(),
    resolveCustomRequestForm: vi.fn(),
    currentGuestKey: vi.fn(),
    removeTempTag: vi.fn(),
    sendSms: vi.fn(),
    issueTrackOtp: vi.fn(),
    checkTrackOtp: vi.fn(),
    cookieJar: new Map<string, string>(),
    setCookie: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.7" }),
  cookies: async () => ({
    get: (name: string) =>
      m.cookieJar.has(name) ? { name, value: m.cookieJar.get(name) } : undefined,
    set: m.setCookie,
  }),
}));
vi.mock("@/env", () => ({
  env: { NODE_ENV: "test", BETTER_AUTH_SECRET: "s".repeat(32), TURNSTILE_SECRET_KEY: "x" },
}));
vi.mock("@/lib/db", () => ({ db: m.db }));
vi.mock("@/lib/session", () => ({ getSession: m.getSession }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.rateLimit }));
vi.mock("@/lib/sms", async (importOriginal) => ({
  ...(await importOriginal<typeof SmsModule>()),
  getSmsProvider: () => ({ send: m.sendSms }),
}));
vi.mock("./turnstile", () => ({ verifyTurnstile: m.verifyTurnstile }));
vi.mock("./resolve-form", () => ({
  resolveServiceRequestForm: m.resolveServiceRequestForm,
  resolveCustomRequestForm: m.resolveCustomRequestForm,
}));
vi.mock("./track-otp", () => ({
  issueTrackOtp: m.issueTrackOtp,
  checkTrackOtp: m.checkTrackOtp,
}));
vi.mock("@/features/media/uploader", () => ({ currentGuestKey: m.currentGuestKey }));
vi.mock("@/features/media/cloudinary", () => ({ removeTempTag: m.removeTempTag }));

import { cancelRequest, sendTrackOtp, submitServiceRequest, verifyTrackOtp } from "./actions";
import { signTrackToken, TRACK_COOKIE } from "./track-token";

const schema: FormSchema = {
  schemaVersion: 1,
  kind: "REQUEST",
  common: { photos: "optional" },
  sections: [
    {
      key: "job",
      title: { bn: "কাজ", en: "কাজ" },
      fields: [
        {
          key: "variant",
          type: "select",
          label: { bn: "ধরন", en: "ধরন" },
          required: true,
          options: [
            { value: "repair", label: { bn: "মেরামত", en: "মেরামত" } },
            { value: "install", label: { bn: "ইনস্টল", en: "ইনস্টল" } },
          ],
        },
        {
          key: "problem",
          type: "textarea",
          label: { bn: "সমস্যা", en: "সমস্যা" },
          required: true,
          showIf: { field: "variant", op: "eq", value: "repair" },
        },
        {
          key: "urgency",
          type: "radio",
          label: { bn: "কত জরুরি", en: "কত জরুরি" },
          options: [
            { value: "normal", label: { bn: "সাধারণ", en: "সাধারণ" } },
            { value: "emergency", label: { bn: "জরুরি", en: "জরুরি" } },
          ],
        },
        {
          key: "pics",
          type: "images",
          label: { bn: "ছবি", en: "ছবি" },
          validation: { maxFiles: 3 },
        },
      ],
    },
  ],
};

const form = (overrides: Record<string, unknown> = {}) => ({
  type: "SERVICE",
  slug: "ac-installation",
  titleBn: "এসি ইনস্টলেশন",
  serviceId: "svc_ac",
  categoryId: "cat_home",
  category: { slug: "home-office", nameBn: "হোম" },
  allowGuest: true,
  isEmergency: false,
  presets: { pinned: { variant: "install" } },
  formVersionId: "fv_1",
  schema,
  ...overrides,
});

const payload = (details: Record<string, unknown> = {}, common: Record<string, unknown> = {}) => ({
  common: { contactName: "রহিম উদ্দিন", contactPhone: "01712-345678", ...common },
  details,
});

const guestInput = (overrides: Record<string, unknown> = {}) => ({
  target: { kind: "service" as const, slug: "ac-installation" },
  payload: payload(),
  turnstileToken: "tok",
  ...overrides,
});

const verifiedUser = {
  user: { id: "user_1", phoneNumber: "+8801812345678", phoneNumberVerified: true },
};

beforeEach(() => {
  vi.clearAllMocks();
  m.cookieJar.clear();
  m.getSession.mockResolvedValue(null);
  m.rateLimit.mockResolvedValue({ success: true, retryAfter: 0 });
  m.verifyTurnstile.mockResolvedValue("ok");
  m.resolveServiceRequestForm.mockResolvedValue(form());
  m.db.serviceRequest.findFirst.mockResolvedValue(null);
  m.db.blockedPhone.count.mockResolvedValue(0);
  m.tx.serviceRequest.findMany.mockResolvedValue([]);
  m.tx.serviceRequest.create.mockResolvedValue({ id: "req_1" });
  m.currentGuestKey.mockResolvedValue("guestKEY");
  m.removeTempTag.mockResolvedValue(undefined);
});

const created = () => m.tx.serviceRequest.create.mock.calls[0]![0].data;

describe("submitServiceRequest — guest (D-03)", () => {
  it("creates a guest request: code, CREATED event, hashed IP, pinned + stripped details", async () => {
    const result = await submitServiceRequest(
      guestInput({
        // A tampered client: tries to change the pinned variant and sends a hidden field.
        payload: payload({ variant: "repair", problem: "লুকানো উত্তর", urgency: "normal" }),
      }),
    );
    expect(result).toMatchObject({ ok: true, duplicate: false });
    expect((result as { code: string }).code).toMatch(/^AB-\d{6}-0001$/);

    const data = created();
    expect(data).toMatchObject({
      type: "SERVICE",
      isGuest: true,
      userId: null,
      serviceId: "svc_ac",
      formVersionId: "fv_1",
      contactPhone: "+8801712345678",
      priority: "NORMAL",
      details: { variant: "install", urgency: "normal" },
      events: { create: { type: "CREATED", toStatus: "NEW", visibleToUser: true } },
    });
    expect(data.details).not.toHaveProperty("problem");
    expect(data.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(data.ipHash).not.toContain("203.0.113.7");

    expect(m.verifyTurnstile).toHaveBeenCalledWith("tok", "203.0.113.7");
    expect(m.rateLimit).toHaveBeenCalledWith("requestGuestIp", "203.0.113.7");
    expect(m.rateLimit).toHaveBeenCalledWith("requestGuestPhone", "+8801712345678");
  });

  it("refuses guests when the service's allowGuest kill-switch is off", async () => {
    m.resolveServiceRequestForm.mockResolvedValue(form({ allowGuest: false }));
    await expect(submitServiceRequest(guestInput())).resolves.toMatchObject({
      ok: false,
      status: 401,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a failed Turnstile check", async () => {
    m.verifyTurnstile.mockResolvedValue("invalid");
    await expect(submitServiceRequest(guestInput())).resolves.toMatchObject({
      ok: false,
      status: 400,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("never blocks an emergency request on Turnstile — flags it instead", async () => {
    m.resolveServiceRequestForm.mockResolvedValue(form({ isEmergency: true, presets: {} }));
    m.verifyTurnstile.mockResolvedValue("unavailable");
    const result = await submitServiceRequest(
      guestInput({ turnstileToken: undefined, payload: payload({ variant: "install" }) }),
    );
    expect(result).toMatchObject({ ok: true });
    expect(created()).toMatchObject({
      priority: "EMERGENCY",
      adminTags: ["turnstile-unavailable"],
    });
    expect(m.rateLimit).toHaveBeenCalledWith("requestEmergencyIp", "203.0.113.7");
    expect(m.rateLimit).not.toHaveBeenCalledWith("requestGuestPhone", expect.anything());
  });

  it("silently rejects a filled honeypot before doing any work", async () => {
    await expect(
      submitServiceRequest(guestInput({ website: "http://spam" })),
    ).resolves.toMatchObject({ ok: false, status: 400 });
    expect(m.resolveServiceRequestForm).not.toHaveBeenCalled();
  });

  it("returns Bangla field errors from the server-side validation", async () => {
    const result = await submitServiceRequest(
      guestInput({ payload: payload({}, { contactPhone: "12345" }) }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect((result as { fieldErrors: Record<string, string> }).fieldErrors).toHaveProperty(
      "common.contactPhone",
    );
  });

  it("refuses a blocked phone", async () => {
    m.db.blockedPhone.count.mockResolvedValue(1);
    await expect(submitServiceRequest(guestInput())).resolves.toMatchObject({
      ok: false,
      status: 403,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("returns the existing code for a duplicate within 10 minutes", async () => {
    m.db.serviceRequest.findFirst.mockResolvedValue({ code: "AB-260928-0007" });
    await expect(submitServiceRequest(guestInput())).resolves.toEqual({
      ok: true,
      code: "AB-260928-0007",
      duplicate: true,
    });
    expect(m.db.serviceRequest.findFirst.mock.calls[0]![0].where).toMatchObject({
      contactPhone: "+8801712345678",
      serviceId: "svc_ac",
      status: { not: "CANCELLED" },
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    m.rateLimit.mockResolvedValue({ success: false, retryAfter: 60 });
    await expect(submitServiceRequest(guestInput())).resolves.toMatchObject({
      ok: false,
      status: 429,
    });
  });

  it("claims the guest's own TEMP images and records each field", async () => {
    m.tx.mediaAsset.findMany.mockResolvedValue([
      { id: "m1", publicId: "p1" },
      { id: "m2", publicId: "p2" },
    ]);
    m.tx.mediaAsset.updateMany.mockResolvedValue({ count: 2 });
    await submitServiceRequest(guestInput({ payload: payload({ pics: ["m1", "m2"] }) }));

    expect(m.tx.mediaAsset.findMany.mock.calls[0]![0].where).toMatchObject({
      id: { in: ["m1", "m2"] },
      status: "TEMP",
      purpose: "REQUEST",
      guestKey: "guestKEY",
      uploadedById: null,
    });
    expect(m.tx.requestAttachment.createMany).toHaveBeenCalledWith({
      data: [
        { requestId: "req_1", mediaId: "m1", fieldKey: "pics" },
        { requestId: "req_1", mediaId: "m2", fieldKey: "pics" },
      ],
    });
    expect(m.removeTempTag).toHaveBeenCalledWith(["p1", "p2"]);
  });

  it("refuses images that are not the caller's", async () => {
    m.tx.mediaAsset.findMany.mockResolvedValue([]);
    await expect(
      submitServiceRequest(guestInput({ payload: payload({ pics: ["someone-elses"] }) })),
    ).resolves.toMatchObject({ ok: false, status: 400 });
    expect(m.removeTempTag).not.toHaveBeenCalled();
  });

  it("retries with a new code when two submits race for the same one", async () => {
    const conflict = Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["code"] } });
    m.tx.serviceRequest.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ code: "AB-260928-0001" }]);
    m.tx.serviceRequest.create.mockRejectedValueOnce(conflict).mockResolvedValueOnce({ id: "r" });
    const result = await submitServiceRequest(guestInput());
    expect(result).toMatchObject({ ok: true });
    expect((result as { code: string }).code).toMatch(/-0002$/);
  });
});

describe("submitServiceRequest — logged-in user", () => {
  it("links the request to the user and skips Turnstile", async () => {
    m.getSession.mockResolvedValue(verifiedUser);
    await expect(
      submitServiceRequest(guestInput({ turnstileToken: undefined })),
    ).resolves.toMatchObject({ ok: true });
    expect(created()).toMatchObject({ userId: "user_1", isGuest: false });
    expect(m.verifyTurnstile).not.toHaveBeenCalled();
    expect(m.rateLimit).toHaveBeenCalledWith("requestUser", "user_1");
  });

  it("asks a user without a verified phone to verify it first (D-02)", async () => {
    m.getSession.mockResolvedValue({ user: { id: "user_2", phoneNumber: null } });
    await expect(submitServiceRequest(guestInput())).resolves.toMatchObject({
      ok: false,
      status: 403,
      needPhone: true,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("custom requests are type CUSTOM without a service", async () => {
    m.getSession.mockResolvedValue(verifiedUser);
    m.resolveCustomRequestForm.mockResolvedValue(
      form({ type: "CUSTOM", slug: "custom", serviceId: null, presets: {} }),
    );
    await submitServiceRequest({
      target: { kind: "custom" },
      payload: payload({ variant: "repair", problem: "পুরনো টিভি বিক্রি করতে চাই" }),
    });
    expect(created()).toMatchObject({ type: "CUSTOM", serviceId: null });
  });
});

describe("cancelRequest", () => {
  it("lets the owner cancel a NEW request and logs a visible event", async () => {
    m.getSession.mockResolvedValue(verifiedUser);
    m.db.serviceRequest.findUnique.mockResolvedValue({
      id: "req_1",
      userId: "user_1",
      status: "NEW",
    });
    m.tx.serviceRequest.updateMany.mockResolvedValue({ count: 1 });

    await expect(cancelRequest({ code: "AB-260928-0001" })).resolves.toEqual({ ok: true });
    expect(m.tx.serviceRequest.updateMany.mock.calls[0]![0].where).toMatchObject({
      id: "req_1",
      status: { in: ["NEW", "REVIEWING"] },
    });
    expect(m.tx.requestEvent.create.mock.calls[0]![0].data).toMatchObject({
      type: "STATUS_CHANGE",
      fromStatus: "NEW",
      toStatus: "CANCELLED",
      visibleToUser: true,
    });
  });

  it("answers 404 for someone else's request (no IDOR)", async () => {
    m.getSession.mockResolvedValue(verifiedUser);
    m.db.serviceRequest.findUnique.mockResolvedValue({
      id: "req_9",
      userId: "user_9",
      status: "NEW",
    });
    await expect(cancelRequest({ code: "AB-260928-0009" })).resolves.toMatchObject({
      ok: false,
      status: 404,
    });
    expect(m.db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses once work has started", async () => {
    m.getSession.mockResolvedValue(verifiedUser);
    m.db.serviceRequest.findUnique.mockResolvedValue({
      id: "req_1",
      userId: "user_1",
      status: "PROCESSING",
    });
    await expect(cancelRequest({ code: "AB-260928-0001" })).resolves.toMatchObject({
      ok: false,
      status: 409,
    });
  });

  it("accepts a guest holding the /track cookie for that request only", async () => {
    m.cookieJar.set(TRACK_COOKIE, signTrackToken("req1guestabc", "s".repeat(32)));
    m.db.serviceRequest.findUnique.mockResolvedValue({
      id: "req1guestabc",
      userId: null,
      status: "NEW",
    });
    m.tx.serviceRequest.updateMany.mockResolvedValue({ count: 1 });
    await expect(cancelRequest({ code: "AB-260928-0001" })).resolves.toEqual({ ok: true });

    m.db.serviceRequest.findUnique.mockResolvedValue({
      id: "req2otherxyz",
      userId: null,
      status: "NEW",
    });
    await expect(cancelRequest({ code: "AB-260928-0002" })).resolves.toMatchObject({ status: 404 });
  });
});

describe("/track OTP", () => {
  it("answers the same whether or not code + phone match, and only texts a real match", async () => {
    m.db.serviceRequest.findFirst.mockResolvedValue(null);
    await expect(sendTrackOtp({ code: "AB-260928-0001", phone: "01712345678" })).resolves.toEqual({
      ok: true,
    });
    expect(m.sendSms).not.toHaveBeenCalled();

    m.db.serviceRequest.findFirst.mockResolvedValue({ id: "req_1" });
    m.issueTrackOtp.mockResolvedValue("123456");
    await expect(sendTrackOtp({ code: "ab-260928-0001", phone: "01712345678" })).resolves.toEqual({
      ok: true,
    });
    expect(m.db.serviceRequest.findFirst.mock.calls[1]![0].where).toEqual({
      code: "AB-260928-0001",
      contactPhone: "+8801712345678",
    });
    expect(m.sendSms).toHaveBeenCalledWith({
      to: "+8801712345678",
      text: expect.stringContaining("১২৩৪৫৬"),
    });
  });

  it("sets a cookie for that one request on a correct code", async () => {
    m.db.serviceRequest.findFirst.mockResolvedValue({ id: "req1abcdefgh" });
    m.checkTrackOtp.mockResolvedValue("ok");
    await expect(
      verifyTrackOtp({ code: "AB-260928-0001", phone: "01712345678", otp: "123456" }),
    ).resolves.toEqual({ ok: true, code: "AB-260928-0001" });
    const [name, value, options] = m.setCookie.mock.calls[0]!;
    expect(name).toBe(TRACK_COOKIE);
    expect(value).toMatch(/^req1abcdefgh\./);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("rejects a wrong or expired code without a cookie", async () => {
    m.db.serviceRequest.findFirst.mockResolvedValue({ id: "req_1" });
    m.checkTrackOtp.mockResolvedValue("invalid");
    await expect(
      verifyTrackOtp({ code: "AB-260928-0001", phone: "01712345678", otp: "000000" }),
    ).resolves.toMatchObject({ ok: false, status: 400 });
    m.checkTrackOtp.mockResolvedValue("expired");
    await expect(
      verifyTrackOtp({ code: "AB-260928-0001", phone: "01712345678", otp: "000000" }),
    ).resolves.toMatchObject({ ok: false, error: expect.stringContaining("মেয়াদ") });
    expect(m.setCookie).not.toHaveBeenCalled();
  });
});
