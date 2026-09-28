import { validatePresets, validateTemplate } from "./meta-schema";
import { formTemplates, getTemplate } from "./templates";
import type { FormField, FormSchema } from "./types";

const base = (fields: FormField[], extra: Partial<FormSchema> = {}): FormSchema => ({
  schemaVersion: 1,
  kind: "REQUEST",
  common: {},
  sections: [{ key: "s", title: { bn: "s", en: "s" }, fields }],
  ...extra,
});
const text = (key: string, extra: Partial<FormField> = {}): FormField => ({
  key,
  type: "text",
  label: { bn: key, en: key },
  ...extra,
});
const messages = (schema: unknown) => validateTemplate(schema).map((issue) => issue.message);

describe("template registry", () => {
  it("has the 37 templates from docs/03, with unique keys", () => {
    expect(formTemplates).toHaveLength(37);
    expect(new Set(formTemplates.map((t) => t.key)).size).toBe(37);
  });

  it("templates are JSON (stored as FormTemplateVersion.schema)", () => {
    for (const template of formTemplates) {
      expect(JSON.parse(JSON.stringify(template.schema))).toEqual(template.schema);
      expect(template.schema.kind).toBe(template.kind);
    }
  });
});

describe.each(formTemplates.map((template) => [template.key, template] as const))(
  "seeded template %s",
  (_key, template) => {
    it("passes the meta-schema", () => {
      expect(validateTemplate(template.schema)).toEqual([]);
    });
  },
);

describe("meta-schema rejects broken templates", () => {
  it.each<[string, FormSchema, string]>([
    ["duplicate keys", base([text("a"), text("a")]), 'duplicate field key "a"'],
    [
      "forward showIf",
      base([text("a", { showIf: { field: "b", op: "truthy" } }), text("b")]),
      "EARLIER field",
    ],
    [
      "unknown showIf field",
      base([text("a", { showIf: { field: "zzz", op: "truthy" } })]),
      "EARLIER field",
    ],
    [
      "choice without options",
      base([{ key: "c", type: "radio", label: { bn: "c", en: "c" } }]),
      "needs options",
    ],
    [
      "options on text",
      base([text("t", { options: [{ value: "x", label: { bn: "x", en: "x" } }] })]),
      "must not have options",
    ],
    ["reserved request key", base([text("contactPhone")]), "reserved"],
    ["reserved listing key", base([text("price")], { kind: "LISTING" }), "reserved"],
    [
      "bad showIf value",
      base([
        {
          key: "c",
          type: "radio",
          label: { bn: "c", en: "c" },
          options: [{ value: "a", label: { bn: "a", en: "a" } }],
        },
        text("d", { showIf: { field: "c", op: "eq", value: "nope" } }),
      ]),
      "not an option",
    ],
    [
      "rule on unknown field",
      base([text("a")], {
        rules: [{ type: "requireOneOf", fields: ["a", "ghost"], message: { bn: "x", en: "x" } }],
      }),
      "unknown field",
    ],
    [
      "item_list without units",
      base([{ key: "items", type: "item_list", label: { bn: "i", en: "i" } }]),
      "validation.units",
    ],
    [
      "images without maxFiles",
      base([{ key: "pics", type: "images", label: { bn: "p", en: "p" } }]),
      "maxFiles",
    ],
    ["filterable on a request", base([text("a", { filterable: true })]), "filterable"],
    [
      "bad default",
      base([{ key: "n", type: "number", label: { bn: "n", en: "n" }, defaultValue: "lots" }]),
      "defaultValue",
    ],
  ])("%s", (_name, schema, expected) => {
    expect(messages(schema).join(" | ")).toContain(expected);
  });

  it.each([
    ["non camelCase key", base([text("Bad-Key")])],
    ["unknown property (typo)", base([{ ...text("a"), requried: true } as unknown as FormField])],
    [
      "unknown field type",
      base([{ key: "x", type: "colour", label: { bn: "x", en: "x" } } as unknown as FormField]),
    ],
    ["missing Bangla label", base([{ key: "x", type: "text", label: { bn: "", en: "x" } }])],
    [
      "missing English label",
      base([{ key: "x", type: "text", label: { bn: "x" } } as unknown as FormField]),
    ],
  ])("%s", (_name, schema) => {
    expect(validateTemplate(schema).length).toBeGreaterThan(0);
  });
});

describe("validatePresets", () => {
  const ac = getTemplate("ac_service")!.schema;
  const grocery = getTemplate("grocery_order")!.schema;

  it("accepts real service presets", () => {
    expect(validatePresets(ac, { pinned: { variant: "repair" } })).toEqual([]);
    expect(
      validatePresets(grocery, {
        defaults: { items: [{ name: "দুধ", qty: 1, unit: "litre" }], frequency: "daily" },
      }),
    ).toEqual([]);
  });

  it("rejects unknown fields, invalid options and invalid item units", () => {
    expect(validatePresets(ac, { pinned: { nope: 1 } })[0]?.message).toContain(
      "not in the template",
    );
    expect(validatePresets(ac, { pinned: { variant: "teleport" } })[0]?.message).toContain(
      "invalid value",
    );
    expect(
      validatePresets(grocery, { defaults: { items: [{ name: "দুধ", qty: 1, unit: "ton" }] } }),
    ).toHaveLength(1);
  });

  it("rejects a key that is both pinned and default", () => {
    expect(
      validatePresets(ac, { pinned: { variant: "repair" }, defaults: { variant: "repair" } }),
    ).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("both pinned and default") }),
    );
  });
});
