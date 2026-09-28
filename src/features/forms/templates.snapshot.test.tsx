// docs/04 P6: "snapshot of rendered field set per template" — for every template, and for every
// seeded service preset of it, the visible sections → fields at initial values. Plus a render
// smoke test mounting DynamicForm for each template.
import { renderWithI18n } from "@/test/i18n";
import { screen } from "@testing-library/react";

import { categories } from "../../../prisma/seed/data/catalog";
import { commonFields } from "./common-fields";
import { DynamicForm } from "./components/dynamic-form";
import { initialValues } from "./defaults";
import { bn } from "./schema-utils";
import { formTemplates } from "./templates";
import type { FormSchema, ServiceFormPresets } from "./types";
import { computeVisible } from "./visibility";

vi.mock("@/features/media/components/image-uploader", () => ({
  ImageUploader: ({ label }: { label: string }) => <div>{label}</div>,
}));

const services = categories.flatMap((category) => category.services ?? []);

function fieldPlan(schema: FormSchema, presets?: ServiceFormPresets) {
  const { details } = initialValues(schema, { presets });
  const visible = computeVisible(schema, details, presets);
  const sections = schema.sections
    .map((section) => ({
      section: `${section.key}: ${bn(section.title)}`,
      fields: section.fields
        .filter((field) => visible.has(field.key))
        .map(
          (field) =>
            `${field.key} [${field.type}${field.required ? ", required" : ""}] ${bn(field.label)}`,
        ),
    }))
    .filter((section) => section.fields.length > 0);
  const common = commonFields(schema).map((field) => `${field.key}${field.required ? " *" : ""}`);
  return { sections, common };
}

describe.each(formTemplates.map((template) => [template.key, template] as const))(
  "%s",
  (key, template) => {
    it("field plan (no presets)", () => {
      expect(fieldPlan(template.schema)).toMatchSnapshot();
    });

    const users = services.filter((service) => service.template === key && service.formPresets);
    for (const service of users) {
      it(`field plan for service ${service.slug}`, () => {
        expect(fieldPlan(template.schema, service.formPresets)).toMatchSnapshot();
      });
    }

    it("renders step 1 with every visible field labelled", () => {
      renderWithI18n(
        <DynamicForm schema={template.schema} areaGroups={[]} onSubmit={async () => undefined} />,
      );
      const plan = fieldPlan(template.schema);
      const firstSection = template.schema.sections.find((section) =>
        plan.sections.some((s) => s.section.startsWith(`${section.key}:`)),
      );
      if (!firstSection) {
        // Attribute-only listing template without fields (listing_other) renders an empty step.
        expect(template.kind).toBe("LISTING");
        return;
      }
      expect(
        screen.getByRole("heading", { level: 2, name: bn(firstSection.title) }),
      ).toBeInTheDocument();
      for (const field of firstSection.fields.filter((f) => f.type !== "heading")) {
        if (!computeVisible(template.schema, initialValues(template.schema).details).has(field.key))
          continue;
        expect(screen.getAllByText(bn(field.label), { exact: false }).length).toBeGreaterThan(0);
      }
    });
  },
);
