import { buildRequestFormSchema } from "@/features/forms/build-zod";
import { tr } from "@/features/forms/schema-utils";
import type { FormSchema } from "@/features/forms/types";

import { isLocale, localeFromPath, localizePath, stripLocale } from "./config";
import { pick, pickText } from "./content";
import { formatDate, formatMoney, relativeTime, toLocaleDigits } from "./format";
import { MESSAGES } from "./messages";
import { localeAlternates } from "./metadata";
import { createTranslator, type MessageTree } from "./translate";

/** Every leaf path of a dictionary ("common.home", …). */
function leafKeys(tree: MessageTree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`),
  );
}

describe("dictionaries", () => {
  it("English has exactly the Bangla keys (no missing or extra)", () => {
    expect(leafKeys(MESSAGES.en).sort()).toEqual(leafKeys(MESSAGES.bn).sort());
  });

  it("no empty strings and the same placeholders in both languages", () => {
    const bn = MESSAGES.bn as unknown as MessageTree;
    const en = MESSAGES.en as unknown as MessageTree;
    const get = (tree: MessageTree, key: string) =>
      key.split(".").reduce<unknown>((node, part) => (node as MessageTree)[part], tree) as string;
    const vars = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of leafKeys(bn)) {
      expect(get(en, key).trim(), key).not.toBe("");
      expect(vars(get(en, key)), key).toEqual(vars(get(bn, key)));
    }
  });
});

describe("translate", () => {
  const t = createTranslator(
    {
      greet: "Hi {name}",
      nested: { deep: "ok" },
      photos: { one: "{count} photo", other: "{count} photos" },
    },
    "en",
  );

  it("interpolates and walks nested keys", () => {
    expect(t("greet" as never, { name: "Rahim" })).toBe("Hi Rahim");
    expect(t("nested.deep" as never)).toBe("ok");
  });

  it("returns the key for unknown paths instead of crashing", () => {
    expect(t("nope.missing" as never)).toBe("nope.missing");
    expect(t("nested" as never)).toBe("nested");
  });

  it("picks English plural forms", () => {
    expect(t.plural("photos" as never, 1)).toBe("1 photo");
    expect(t.plural("photos" as never, 3)).toBe("3 photos");
  });
});

describe("locale paths", () => {
  it("keeps Bangla unprefixed and prefixes English", () => {
    expect(localizePath("bn", "/services/ac-repair")).toBe("/services/ac-repair");
    expect(localizePath("en", "/services/ac-repair")).toBe("/en/services/ac-repair");
    expect(localizePath("en", "/")).toBe("/en");
    expect(localizePath("en", "/?q=ac")).toBe("/en?q=ac");
    expect(localizePath("en", "/admin")).toBe("/en/admin");
  });

  it("re-localizes already prefixed paths and leaves external/API links alone", () => {
    expect(localizePath("bn", "/en/track")).toBe("/track");
    expect(localizePath("en", "/en/track")).toBe("/en/track");
    expect(localizePath("en", "https://wa.me/880")).toBe("https://wa.me/880");
    expect(localizePath("en", "tel:999")).toBe("tel:999");
    expect(localizePath("en", "/api/auth/x")).toBe("/api/auth/x");
    expect(localizePath("en", "//evil.test")).toBe("//evil.test");
  });

  it("strips and detects the locale prefix", () => {
    expect(stripLocale("/en/services/x")).toBe("/services/x");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/bn/track")).toBe("/track");
    expect(stripLocale("/enable")).toBe("/enable");
    expect(localeFromPath("/en/x")).toBe("en");
    expect(localeFromPath("/english")).toBe("bn");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("builds hreflang alternates", () => {
    expect(localeAlternates("en", "/track")).toEqual({
      canonical: "/en/track",
      languages: { "bn-BD": "/track", en: "/en/track", "x-default": "/track" },
    });
  });
});

describe("format", () => {
  it("formats money with the language's digits and lakh grouping", () => {
    expect(formatMoney(1200, "bn")).toBe("৳১,২০০");
    expect(formatMoney(1200, "en")).toBe("৳1,200");
    expect(formatMoney(1250000, "en")).toBe("৳12,50,000");
    expect(() => formatMoney(10.5, "en")).toThrow(RangeError);
  });

  it("converts digits and formats Dhaka dates", () => {
    expect(toLocaleDigits("AB-12", "bn")).toBe("AB-১২");
    expect(toLocaleDigits("১২", "en")).toBe("12");
    const date = new Date("2026-09-27T20:00:00Z"); // 28 Sep in Dhaka
    expect(formatDate(date, "en")).toContain("September 28, 2026");
    expect(formatDate(date, "bn")).toContain("২৮");
  });

  it("writes relative time in both languages", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(relativeTime(new Date("2026-09-28T09:55:00Z"), "en", now)).toBe("5 minutes ago");
    expect(relativeTime(new Date("2026-09-28T09:55:00Z"), "bn", now)).toBe("৫ মিনিট আগে");
    expect(relativeTime(now, "en", now)).toBe("just now");
  });
});

describe("content fallback", () => {
  it("pick() uses English when present, else Bangla", () => {
    expect(pick({ nameBn: "বগুড়া", nameEn: "Bogura" }, "name", "en")).toBe("Bogura");
    expect(pick({ nameBn: "বগুড়া", nameEn: "  " }, "name", "en")).toBe("বগুড়া");
    expect(pick({ nameBn: "বগুড়া", nameEn: "Bogura" }, "name", "bn")).toBe("বগুড়া");
  });

  it("pickText() falls back for null, blank and empty lists", () => {
    expect(pickText("বাংলা", "English", "en")).toBe("English");
    expect(pickText("বাংলা", null, "en")).toBe("বাংলা");
    expect(pickText([1], [], "en")).toEqual([1]);
    expect(pickText("বাংলা", "English", "bn")).toBe("বাংলা");
  });

  it("tr() reads template text in either language with fallback", () => {
    expect(tr({ bn: "হ্যাঁ", en: "Yes" }, "en")).toBe("Yes");
    expect(tr({ bn: "হ্যাঁ" }, "en")).toBe("হ্যাঁ");
    expect(tr(undefined, "bn")).toBe("");
  });
});

describe("form validation messages follow the submitter's language", () => {
  const schema: FormSchema = {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {},
    sections: [
      {
        key: "s",
        title: { bn: "স", en: "S" },
        fields: [
          {
            key: "qty",
            type: "number",
            label: { bn: "সংখ্যা", en: "Qty" },
            required: true,
            validation: { min: 2 },
          },
        ],
      },
    ],
  };

  it("returns English errors for locale en and Bangla by default", () => {
    const payload = { common: {}, details: { qty: 1 } };
    const en = buildRequestFormSchema(schema, { mode: "server", locale: "en" }).safeParse(payload);
    const bn = buildRequestFormSchema(schema, { mode: "server" }).safeParse(payload);
    const messages = (result: typeof en) =>
      result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages(en)).toEqual(
      expect.arrayContaining(["Enter at least 2.", "Enter a mobile number"]),
    );
    expect(messages(bn)).toEqual(expect.arrayContaining(["কমপক্ষে ২ দিন।"]));
  });
});
