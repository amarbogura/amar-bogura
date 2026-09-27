// Structural checks on seeded templates. P6 replaces these with the full meta-schema
// (formSchemaSchema); until then they keep the seed sources honest.
import {
  CHOICE_FIELD_TYPES,
  type FormField,
  IMAGES_MAX_FILES,
  RESERVED_LISTING_KEYS,
  RESERVED_REQUEST_KEYS,
} from "../types";
import { formTemplates } from "./index";

const fieldsOf = (template: (typeof formTemplates)[number]): FormField[] =>
  template.schema.sections.flatMap((section) => section.fields);

const cases = formTemplates.map((template) => [template.key, template] as const);

describe("form template registry", () => {
  it("has unique template keys", () => {
    const keys = formTemplates.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("covers every template named in docs/03", () => {
    expect(formTemplates).toHaveLength(37);
  });

  it("is JSON-serializable (stored as FormTemplateVersion.schema)", () => {
    for (const template of formTemplates) {
      expect(JSON.parse(JSON.stringify(template.schema))).toEqual(template.schema);
    }
  });
});

describe.each(cases)("template %s", (_key, template) => {
  const fields = fieldsOf(template);

  it("declares a matching kind and schemaVersion 1", () => {
    expect(template.schema.kind).toBe(template.kind);
    expect(template.schema.schemaVersion).toBe(1);
  });

  it("has unique section and field keys in camelCase", () => {
    const fieldKeys = fields.map((f) => f.key);
    expect(new Set(fieldKeys).size).toBe(fieldKeys.length);
    const sectionKeys = template.schema.sections.map((s) => s.key);
    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
    for (const key of fieldKeys) expect(key).toMatch(/^[a-z][a-zA-Z0-9]*$/);
  });

  it("uses no reserved keys", () => {
    const reserved: readonly string[] =
      template.kind === "REQUEST" ? RESERVED_REQUEST_KEYS : RESERVED_LISTING_KEYS;
    for (const field of fields) expect(reserved).not.toContain(field.key);
  });

  it("gives every choice field unique options", () => {
    for (const field of fields) {
      const isChoice = (CHOICE_FIELD_TYPES as readonly string[]).includes(field.type);
      if (!isChoice) {
        expect(field.options, field.key).toBeUndefined();
        continue;
      }
      expect(field.options?.length, field.key).toBeGreaterThan(0);
      const values = field.options!.map((o) => o.value);
      expect(new Set(values).size, field.key).toBe(values.length);
    }
  });

  it("only references earlier fields in showIf, with valid option values", () => {
    fields.forEach((field, index) => {
      const rules = field.showIf ? [field.showIf].flat() : [];
      for (const rule of rules) {
        const target = fields.slice(0, index).find((f) => f.key === rule.field);
        expect(target, `${field.key} → ${rule.field}`).toBeDefined();
        if (target?.options && rule.value !== undefined) {
          const allowed = target.options.map((o) => o.value);
          for (const value of [rule.value].flat()) expect(allowed).toContain(value);
        }
      }
    });
  });

  it("caps image fields at the global maximum", () => {
    for (const field of fields.filter((f) => f.type === "images")) {
      expect(field.validation?.maxFiles ?? 0).toBeGreaterThan(0);
      expect(field.validation?.maxFiles ?? 0).toBeLessThanOrEqual(IMAGES_MAX_FILES);
    }
  });

  it("only marks listing fields as filterable", () => {
    if (template.kind === "REQUEST") {
      for (const field of fields) expect(field.filterable, field.key).toBeFalsy();
    }
  });
});
