import * as lucide from "lucide-react";

import { formTemplates } from "@/features/forms/templates";

import { validateSeedData } from "./checks";
import { areas } from "./data/areas";
import { categories } from "./data/catalog";
import { homeSections } from "./data/cms";
import type { CategorySeed } from "./data/types";

const seed = { categories, templates: formTemplates, areas, homeSections };
const services = categories.flatMap((c) => c.services ?? []);
const listingCategories = categories.flatMap((c) => c.listingCategories ?? []);

describe("seed data", () => {
  it("passes all seed-time checks", () => {
    expect(validateSeedData(seed)).toEqual([]);
  });

  it("has exactly the 12 homepage categories", () => {
    expect(categories).toHaveLength(12);
  });

  it("matches the docs/03 §6 catalog size", () => {
    expect(services).toHaveLength(41);
    expect(listingCategories).toHaveLength(11);
  });

  it("covers Bogura district, its 12 upazilas and Sadar areas", () => {
    expect(areas.filter((a) => a.type === "DISTRICT")).toHaveLength(1);
    expect(areas.filter((a) => a.type === "UPAZILA")).toHaveLength(12);
    expect(areas.filter((a) => a.type === "AREA").length).toBeGreaterThanOrEqual(10);
  });

  it("uses slugs in kebab-case", () => {
    const slugs = [...categories, ...services, ...listingCategories, ...areas].map((x) => x.slug);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("uses icon keys that exist in lucide-react", () => {
    const toPascal = (key: string) =>
      key.replace(/(^|-)([a-z0-9])/g, (_m, _dash, char: string) => char.toUpperCase());
    const keys = [...categories, ...services, ...listingCategories].map((x) => x.iconKey);
    for (const key of keys) expect(lucide, key).toHaveProperty(toPascal(key));
  });

  it("marks only the ambulance as an emergency service", () => {
    expect(services.filter((s) => s.isEmergency).map((s) => s.slug)).toEqual(["ambulance"]);
  });
});

describe("validateSeedData", () => {
  const clone = (): CategorySeed[] => structuredClone(categories);

  it("detects a slug shared by a category and a service", () => {
    const data = clone();
    data[0]!.services![0]!.slug = "education";
    expect(validateSeedData({ ...seed, categories: data })).toContainEqual(
      expect.stringContaining('Slug "education"'),
    );
  });

  it("detects an unknown template key", () => {
    const data = clone();
    data[0]!.services![0]!.template = "missing_template";
    expect(validateSeedData({ ...seed, categories: data })).toContainEqual(
      expect.stringContaining("unknown template"),
    );
  });

  it("detects a pinned value that is not a valid option", () => {
    const data = clone();
    const acRepair = data[0]!.services!.find((s) => s.slug === "ac-repair")!;
    acRepair.formPresets = { pinned: { variant: "teleport" } };
    expect(validateSeedData({ ...seed, categories: data })).toContainEqual(
      expect.stringContaining('variant="teleport"'),
    );
  });

  it("detects a preset for a field the template does not have", () => {
    const data = clone();
    data[0]!.services![0]!.formPresets = { defaults: { nope: 1 } };
    expect(validateSeedData({ ...seed, categories: data })).toContainEqual(
      expect.stringContaining('"nope"'),
    );
  });
});
