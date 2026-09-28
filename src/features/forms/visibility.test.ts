import { getTemplate } from "./templates";
import type { FormField, FormSchema } from "./types";
import { computeKept, computeVisible, ruleHolds } from "./visibility";

const schema = (fields: FormField[]): FormSchema => ({
  schemaVersion: 1,
  kind: "REQUEST",
  common: {},
  sections: [{ key: "s", title: { bn: "s", en: "s" }, fields }],
});
const f = (key: string, extra: Partial<FormField> = {}): FormField => ({
  key,
  type: "text",
  label: { bn: key, en: key },
  ...extra,
});

describe("ruleHolds", () => {
  it.each([
    [{ op: "eq", value: "a" }, "a", true],
    [{ op: "eq", value: "a" }, "b", false],
    [{ op: "eq", value: 2 }, "2", true],
    [{ op: "eq", value: "a" }, undefined, false],
    [{ op: "neq", value: "a" }, "b", true],
    [{ op: "neq", value: "a" }, "a", false],
    [{ op: "neq", value: "a" }, undefined, false], // not before the controller is answered
    [{ op: "in", value: ["a", "b"] }, "b", true],
    [{ op: "in", value: ["a", "b"] }, "c", false],
    [{ op: "in", value: ["ac"] }, ["tv", "ac"], true], // checkboxes: any overlap
    [{ op: "in", value: ["ac"] }, ["tv"], false],
    [{ op: "notIn", value: ["a"] }, "b", true],
    [{ op: "notIn", value: ["a"] }, ["a", "b"], false],
    [{ op: "notIn", value: ["a"] }, [], false],
    [{ op: "truthy" }, true, true],
    [{ op: "truthy" }, false, false],
    [{ op: "truthy" }, "", false],
    [{ op: "falsy" }, false, true],
    [{ op: "falsy" }, undefined, true],
    [{ op: "falsy" }, "x", false],
  ] as const)("%j with %j → %s", (rule, value, expected) => {
    expect(ruleHolds({ field: "x", ...rule } as never, value)).toBe(expected);
  });
});

describe("computeVisible", () => {
  const form = schema([
    f("kind", {
      type: "radio",
      options: [
        { value: "a", label: { bn: "a", en: "a" } },
        { value: "b", label: { bn: "b", en: "b" } },
      ],
    }),
    f("forA", { showIf: { field: "kind", op: "eq", value: "a" } }),
    f("needsExtra", { type: "boolean", showIf: { field: "kind", op: "eq", value: "a" } }),
    f("extra", { showIf: { field: "needsExtra", op: "truthy" } }),
    f("both", {
      showIf: [
        { field: "kind", op: "eq", value: "a" },
        { field: "needsExtra", op: "truthy" },
      ],
    }),
    f("always"),
  ]);

  it("shows only fields whose rules hold", () => {
    expect([...computeVisible(form, { kind: "b" })]).toEqual(["kind", "always"]);
    expect([...computeVisible(form, { kind: "a" })]).toEqual([
      "kind",
      "forA",
      "needsExtra",
      "always",
    ]);
  });

  it("ANDs array rules", () => {
    expect(computeVisible(form, { kind: "a", needsExtra: true }).has("both")).toBe(true);
    expect(computeVisible(form, { kind: "a", needsExtra: false }).has("both")).toBe(false);
  });

  it("cascades: a field controlled by a hidden field is hidden, even if the stale value matches", () => {
    // needsExtra=true was answered, then kind switched to "b" → needsExtra hidden → extra hidden.
    const visible = computeVisible(form, { kind: "b", needsExtra: true });
    expect(visible.has("needsExtra")).toBe(false);
    expect(visible.has("extra")).toBe(false);
  });

  it("pinned fields are never shown but still drive rules (AC installation)", () => {
    const ac = getTemplate("ac_service")!.schema;
    const visible = computeVisible(
      ac,
      { variant: "repair" },
      { pinned: { variant: "installation" } },
    );
    expect(visible.has("variant")).toBe(false);
    expect(visible.has("installKind")).toBe(true);
    expect(visible.has("problem")).toBe(false);
    expect(computeKept(ac, {}, { pinned: { variant: "installation" } }).has("variant")).toBe(true);
  });

  it("vehicle_rent: truck shows goods/truckSize, car shows passengers/class", () => {
    const vehicle = getTemplate("vehicle_rent")!.schema;
    const truck = computeVisible(vehicle, {}, { pinned: { vehicleType: "truck" } });
    expect(
      [...truck].filter((k) => ["goods", "truckSize", "passengers", "carClass"].includes(k)),
    ).toEqual(["goods", "truckSize"]);
    const car = computeVisible(vehicle, {}, { pinned: { vehicleType: "car" } });
    expect(car.has("carClass")).toBe(true);
    expect(car.has("goods")).toBe(false);
  });
});
