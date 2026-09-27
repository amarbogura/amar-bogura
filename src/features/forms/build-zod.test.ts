import {
  buildCommonSchema,
  buildDetailsSchema,
  type BuildOptions,
  buildRequestFormSchema,
  toServerPayload,
} from "./build-zod";
import { getTemplate } from "./templates";
import type { FormField, FormSchema } from "./types";

// Fixed clock: 2026-09-28 10:00 in Dhaka.
const NOW = new Date("2026-09-28T04:00:00Z");
const client = { mode: "client" as const, now: NOW };
const server = { mode: "server" as const, now: NOW };

const schema = (fields: FormField[], extra: Partial<FormSchema> = {}): FormSchema => ({
  schemaVersion: 1,
  kind: "REQUEST",
  common: {},
  sections: [{ key: "s", title: { bn: "s" }, fields }],
  ...extra,
});
const parse = (s: FormSchema, details: unknown, options: BuildOptions = client) =>
  buildDetailsSchema(s, options).safeParse(details);
const errorsOf = (result: {
  success: boolean;
  error?: { issues: Array<{ path: PropertyKey[]; message: string }> };
}) =>
  result.success
    ? []
    : result.error!.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

describe("visibility inside validation", () => {
  const form = schema([
    { key: "hasPet", type: "boolean", label: { bn: "পোষা প্রাণী" } },
    {
      key: "petName",
      type: "text",
      label: { bn: "নাম" },
      required: true,
      showIf: { field: "hasPet", op: "truthy" },
    },
  ]);

  it("does not enforce hidden required fields", () => {
    expect(parse(form, { hasPet: false })).toMatchObject({
      success: true,
      data: { hasPet: false },
    });
  });

  it("enforces them once visible", () => {
    expect(errorsOf(parse(form, { hasPet: true }))).toEqual(["petName: এই তথ্যটি দিন।"]);
  });

  it("strips hidden and unknown keys from the output", () => {
    const result = parse(form, { hasPet: false, petName: "টমি", role: "admin", __proto__x: 1 });
    expect(result.data).toEqual({ hasPet: false });
  });
});

describe("presets", () => {
  const ac = getTemplate("ac_service")!.schema;

  it("forces pinned values even if the client sends something else", () => {
    const result = parse(
      ac,
      { variant: "repair", acType: "split", capacity: "1.5", unitCount: 1, installKind: "new" },
      { ...client, presets: { pinned: { variant: "installation" } } },
    );
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ variant: "installation", installKind: "new" });
    expect(result.data).not.toHaveProperty("problem");
  });
});

describe("field types", () => {
  it("normalizes phone numbers to E.164", () => {
    const form = schema([{ key: "alt", type: "phone", label: { bn: "ফোন" }, required: true }]);
    expect(parse(form, { alt: "০১৭১২-৩৪৫৬৭৮" }).data).toEqual({ alt: "+8801712345678" });
    expect(parse(form, { alt: "01212345678" }).success).toBe(false);
  });

  it("item_list: min rows, units and blank rows", () => {
    const form = schema([
      {
        key: "items",
        type: "item_list",
        label: { bn: "তালিকা" },
        required: true,
        validation: { min: 1, max: 2, units: ["kg", "litre"] },
      },
    ]);
    expect(errorsOf(parse(form, { items: [{ name: "", qty: "", unit: "kg" }] }))).toEqual([
      "items: তালিকায় অন্তত ১টি পণ্য লিখুন।",
    ]);
    expect(
      parse(form, {
        items: [
          { name: "দুধ", qty: "১.৫", unit: "litre" },
          { name: "", qty: "", unit: "kg" },
        ],
      }).data,
    ).toEqual({
      items: [{ name: "দুধ", qty: 1.5, unit: "litre" }],
    });
    expect(parse(form, { items: [{ name: "দুধ", qty: 1, unit: "ton" }] }).success).toBe(false);
    expect(parse(form, { items: [{ name: "দুধ", qty: 0, unit: "kg" }] }).success).toBe(false);
    const three = Array.from({ length: 3 }, () => ({ name: "x", qty: 1, unit: "kg" }));
    expect(parse(form, { items: three }).success).toBe(false);
  });

  it("rejects HTML but allows a plain '<'", () => {
    const form = schema([{ key: "note", type: "textarea", label: { bn: "নোট" } }]);
    expect(parse(form, { note: "<script>alert(1)</script>" }).success).toBe(false);
    expect(parse(form, { note: "</b>" }).success).toBe(false);
    expect(parse(form, { note: "ওজন < 5 কেজি" }).data).toEqual({ note: "ওজন < 5 কেজি" });
  });

  it("trims text and enforces length", () => {
    const form = schema([
      { key: "t", type: "text", label: { bn: "t" }, required: true, validation: { maxLength: 5 } },
    ]);
    expect(parse(form, { t: "  abc  " }).data).toEqual({ t: "abc" });
    expect(parse(form, { t: "abcdef" }).success).toBe(false);
    expect(errorsOf(parse(form, { t: "   " }))).toEqual(["t: এই তথ্যটি দিন।"]);
  });

  it("money must be whole taka; numbers accept Bangla digits", () => {
    const form = schema([
      { key: "budget", type: "money", label: { bn: "বাজেট" } },
      { key: "rooms", type: "number", label: { bn: "রুম" }, validation: { min: 1, max: 10 } },
    ]);
    expect(parse(form, { budget: "১২,০০০", rooms: "৩" }).data).toEqual({ budget: 12000, rooms: 3 });
    expect(errorsOf(parse(form, { budget: 12.5 }))).toEqual([
      "budget: পূর্ণ সংখ্যা দিন (দশমিক ছাড়া)।",
    ]);
    expect(parse(form, { rooms: 11 }).success).toBe(false);
    expect(parse(form, { rooms: "abc" }).success).toBe(false);
  });

  it("dates: not in the past (Dhaka) unless min allows it", () => {
    const form = schema([
      { key: "d", type: "date", label: { bn: "d" }, required: true },
      { key: "past", type: "date", label: { bn: "p" }, validation: { min: -30 } },
    ]);
    expect(parse(form, { d: "2026-09-28" }).success).toBe(true); // today in Dhaka
    expect(parse(form, { d: "2026-09-27" }).success).toBe(false);
    expect(parse(form, { d: "2026-02-30" }).success).toBe(false);
    expect(parse(form, { d: "2026-09-28", past: "2026-09-10" }).success).toBe(true);
  });

  it("datetimes are Dhaka local time and not in the past", () => {
    const form = schema([{ key: "at", type: "datetime", label: { bn: "at" }, required: true }]);
    expect(parse(form, { at: "2026-09-28T09:00" }).success).toBe(false); // 09:00 < 10:00 Dhaka
    expect(parse(form, { at: "2026-09-28T10:30" }).success).toBe(true);
    expect(parse(form, { at: "2026-09-28 10:30" }).success).toBe(false);
  });

  it("route: destination cannot equal the start", () => {
    const form = schema([{ key: "route", type: "route", label: { bn: "পথ" }, required: true }]);
    const same = { areaId: "a1", address: "সাতমাথা" };
    expect(
      errorsOf(parse(form, { route: { from: same, to: { ...same, address: " সাতমাথা " } } })),
    ).toEqual(["route.to.address: যাত্রা শুরু ও গন্তব্য একই হতে পারে না।"]);
    expect(
      parse(form, { route: { from: same, to: { areaId: null, address: "ঢাকা মেডিকেল" } } }).success,
    ).toBe(true);
  });

  it("images: client objects vs server ids, capped at maxFiles", () => {
    const form = schema([
      { key: "pics", type: "images", label: { bn: "ছবি" }, validation: { maxFiles: 2 } },
    ]);
    expect(parse(form, { pics: [{ id: "m1", url: "u" }] }).success).toBe(true);
    expect(parse(form, { pics: ["m1"] }).success).toBe(false);
    expect(parse(form, { pics: ["m1", "m2"] }, server).data).toEqual({ pics: ["m1", "m2"] });
    expect(parse(form, { pics: ["m1", "m2", "m3"] }, server).success).toBe(false);
  });

  it("urls get https:// and only http(s) is allowed", () => {
    const form = schema([{ key: "link", type: "url", label: { bn: "লিংক" } }]);
    expect(parse(form, { link: "facebook.com/amar" }).data).toEqual({
      link: "https://facebook.com/amar",
    });
    expect(parse(form, { link: "javascript:alert(1)" }).success).toBe(false);
  });

  it("choices must be options; checkbox arrays are de-duplicated", () => {
    const form = schema([
      {
        key: "c",
        type: "radio",
        label: { bn: "c" },
        required: true,
        options: [{ value: "x", label: { bn: "x" } }],
      },
      {
        key: "m",
        type: "checkboxes",
        label: { bn: "m" },
        options: [
          { value: "a", label: { bn: "a" } },
          { value: "b", label: { bn: "b" } },
        ],
      },
    ]);
    expect(parse(form, { c: "y" }).success).toBe(false);
    expect(parse(form, { c: "x", m: ["a", "a", "b"] }).data).toEqual({ c: "x", m: ["a", "b"] });
  });
});

describe("cross-field rules", () => {
  it("requireOneOf (painter rooms or sqft)", () => {
    const painter = getTemplate("painter")!.schema;
    const base = { scope: "interior", paintSupply: "self" };
    expect(errorsOf(parse(painter, base))).toEqual([
      "roomCount: রুমের সংখ্যা অথবা আনুমানিক বর্গফুট দিন।",
    ]);
    expect(parse(painter, { ...base, areaSqft: 900 }).success).toBe(true);
  });

  it("requireOneOf (medicine prescription or list)", () => {
    const medicine = getTemplate("medicine_delivery")!.schema;
    expect(parse(medicine, { urgency: "today" }).success).toBe(false);
    expect(
      parse(medicine, { urgency: "today", medicines: [{ name: "নাপা", qty: 2, unit: "strip" }] })
        .success,
    ).toBe(true);
  });

  it("after (vehicle return later than start), only when both are visible", () => {
    const vehicle = getTemplate("vehicle_rent")!.schema;
    const presets = { pinned: { vehicleType: "car" } };
    const trip = {
      tripType: "round",
      route: { from: { areaId: "a1", address: "সাতমাথা" }, to: { address: "রাজশাহী" } },
      startAt: "2026-09-29T08:00",
    };
    expect(
      errorsOf(parse(vehicle, { ...trip, returnAt: "2026-09-29T07:00" }, { ...client, presets })),
    ).toEqual(["returnAt: ফেরার সময় যাত্রা শুরুর পরে হতে হবে।"]);
    expect(
      parse(vehicle, { ...trip, returnAt: "2026-09-29T20:00" }, { ...client, presets }).success,
    ).toBe(true);
    // one-way: returnAt hidden → rule skipped
    expect(parse(vehicle, { ...trip, tripType: "one_way" }, { ...client, presets }).success).toBe(
      true,
    );
  });
});

describe("common fields", () => {
  const custom = getTemplate("custom_request")!.schema;

  it("contact name + phone always required; title required for custom requests", () => {
    const result = buildCommonSchema(custom, client).safeParse({});
    expect(errorsOf(result)).toEqual(
      expect.arrayContaining([
        "contactName: এই তথ্যটি দিন।",
        "contactPhone: মোবাইল নম্বর দিন",
        "title: এই তথ্যটি দিন।",
      ]),
    );
  });

  it("normalizes and strips hidden/unknown common keys", () => {
    const ambulance = getTemplate("ambulance")!.schema; // address + date hidden
    const result = buildCommonSchema(ambulance, client).safeParse({
      contactName: " রহিম ",
      contactPhone: "01712345678",
      addressLine: "should be dropped",
      preferredDate: "2026-09-30",
      isSpam: true,
    });
    expect(result.data).toEqual({ contactName: "রহিম", contactPhone: "+8801712345678" });
  });

  it("the whole form validates common + details together", () => {
    const result = buildRequestFormSchema(custom, client).safeParse({
      common: {
        contactName: "রহিম",
        contactPhone: "01712345678",
        title: "কাঠমিস্ত্রি দরকার",
        areaId: "a1",
        addressLine: "সাতমাথা, বগুড়া",
      },
      details: { description: "একটি পুরাতন খাট মেরামত করতে হবে, দুটো পায়া ভাঙা।" },
    });
    expect(result.success).toBe(true);
  });
});

describe("toServerPayload", () => {
  it("turns image objects into media ids", () => {
    const form = schema(
      [{ key: "pics", type: "images", label: { bn: "ছবি" }, validation: { maxFiles: 3 } }],
      {
        common: { photos: "optional" },
      },
    );
    expect(
      toServerPayload(form, {
        common: { photos: [{ id: "c1", url: "u" }] },
        details: { pics: [{ id: "m1", url: "u" }] },
      }),
    ).toEqual({ common: { photos: ["c1"] }, details: { pics: ["m1"] } });
  });
});
