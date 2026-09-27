import { initialValues } from "./defaults";
import { formatValue } from "./format-value";
import { summarize } from "./summarize";
import { getTemplate } from "./templates";
import type { FormField } from "./types";

const field = (extra: Partial<FormField>): FormField => ({
  key: "k",
  type: "text",
  label: { bn: "k" },
  ...extra,
});
const areaNames = new Map([
  ["a1", "সাতমাথা"],
  ["a2", "শেরপুর"],
]);

describe("formatValue", () => {
  it.each<[Partial<FormField>, unknown, string]>([
    [
      { type: "radio", options: [{ value: "split", label: { bn: "স্প্লিট" } }] },
      "split",
      "স্প্লিট",
    ],
    [
      {
        type: "checkboxes",
        options: [
          { value: "a", label: { bn: "এ" } },
          { value: "b", label: { bn: "বি" } },
        ],
      },
      ["a", "b"],
      "এ, বি",
    ],
    [{ type: "boolean" }, true, "হ্যাঁ"],
    [{ type: "boolean" }, false, "না"],
    [{ type: "number" }, 12, "১২"],
    [{ type: "money" }, 1200, "৳১,২০০"],
    [{ type: "phone" }, "+8801712345678", "০১৭১২-৩৪৫৬৭৮"],
    [{ type: "date" }, "2026-09-29", "২৯ সেপ্টেম্বর, ২০২৬"],
    [{ type: "area" }, "a1", "সাতমাথা"],
    [
      { type: "address" },
      { areaId: "a1", line: "বাসা ১২", landmark: "মসজিদের পাশে" },
      "বাসা ১২, মসজিদের পাশে, সাতমাথা",
    ],
    [
      { type: "route" },
      { from: { areaId: "a1", address: "বাসা" }, to: { areaId: null, address: "ঢাকা" } },
      "বাসা, সাতমাথা → ঢাকা",
    ],
    [{ type: "person" }, { name: "রহিম", phone: "+8801712345678" }, "রহিম (০১৭১২-৩৪৫৬৭৮)"],
    [{ type: "item_list" }, [{ name: "দুধ", qty: 1.5, unit: "litre" }], "দুধ ১.৫ লিটার"],
    [{ type: "images" }, ["m1", "m2"], "২টি ছবি"],
    [{ type: "text" }, "", ""],
  ])("%j", (extra, value, expected) => {
    expect(formatValue(field(extra), value, { areaNames })).toBe(expected);
  });

  it("formats Dhaka datetimes", () => {
    expect(formatValue(field({ type: "datetime" }), "2026-09-29T14:30")).toContain("২:৩০");
  });
});

describe("summarize", () => {
  it("joins summary fields in order with Bangla values", () => {
    const ac = getTemplate("ac_service")!.schema;
    expect(
      summarize(ac, {
        variant: "repair",
        acType: "split",
        capacity: "1.5",
        unitCount: 2,
        brand: "Gree",
      }),
    ).toBe("মেরামত · স্প্লিট · ১.৫ টন");
    expect(summarize(ac, { acType: "split", capacity: "1.5", unitCount: 2 }, { max: 5 })).toBe(
      "স্প্লিট · ১.৫ টন · ২",
    );
  });
});

describe("initialValues", () => {
  it("applies field defaults, then preset defaults, then the user's details", () => {
    const grocery = getTemplate("grocery_order")!.schema;
    const values = initialValues(grocery, {
      presets: {
        defaults: { items: [{ name: "দুধ", qty: 1, unit: "litre" }], frequency: "daily" },
      },
      prefill: { name: "রহিম", phone: "+8801712345678", areaId: "a1" },
    });
    expect(values).toEqual({
      common: { contactName: "রহিম", contactPhone: "01712345678", areaId: "a1" },
      details: { items: [{ name: "দুধ", qty: 1, unit: "litre" }], frequency: "daily" },
    });
  });

  it("uses template defaults and skips area prefill when the form has no address", () => {
    const ambulance = getTemplate("ambulance")!.schema;
    expect(initialValues(ambulance, { prefill: { areaId: "a1" } })).toEqual({
      common: {},
      details: { when: "now" },
    });
  });

  it("never shares default objects between forms", () => {
    const grocery = getTemplate("grocery_order")!.schema;
    const presets = { defaults: { items: [{ name: "দুধ", qty: 1, unit: "litre" }] } };
    const a = initialValues(grocery, { presets });
    (a.details.items as Array<{ qty: number }>)[0]!.qty = 99;
    expect(presets.defaults.items[0]!.qty).toBe(1);
  });
});
