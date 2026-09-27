import type { ServiceCardData } from "@/components/service-card";

import {
  type CategoryWithServices,
  referencedSlugs,
  resolveHomeSections,
  type SectionRow,
} from "./sections";

const service = (slug: string): ServiceCardData => ({
  slug,
  nameBn: slug,
  shortDescBn: null,
  iconKey: null,
  startingPrice: null,
  isEmergency: false,
});
const category = (slug: string, services: ServiceCardData[]): CategoryWithServices => ({
  slug,
  kind: "SERVICE",
  nameBn: slug,
  iconKey: "house",
  shortDescBn: null,
  services,
});

const rows: SectionRow[] = [
  {
    key: "quick_actions",
    type: "QUICK_ACTIONS",
    titleBn: "q",
    config: { actions: ["custom-request", "nope", "ambulance"] },
  },
  {
    key: "popular_services",
    type: "SERVICES",
    titleBn: "p",
    config: { serviceSlugs: ["c", "missing", "a"] },
  },
  {
    key: "local_products",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "l",
    config: { categorySlug: "grocery" },
  },
  {
    key: "protutors",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "t",
    config: { categorySlug: "education" },
  },
  {
    key: "gone",
    type: "CATEGORY_SPOTLIGHT",
    titleBn: "g",
    config: { categorySlug: "hidden-category" },
  },
  { key: "recent_listings", type: "LISTINGS", titleBn: "r", config: { limit: 500 } },
  { key: "weird", type: "CAROUSEL_3D", titleBn: "w", config: {} },
];

const services = new Map([
  ["a", service("a")],
  ["c", service("c")],
]);
const categories = new Map([
  ["grocery", category("grocery", [service("milk")])],
  ["education", category("education", [service("home-tutor")])],
]);

describe("referencedSlugs", () => {
  it("collects every service and category slug the sections need", () => {
    expect(referencedSlugs(rows)).toEqual({
      services: ["c", "missing", "a"],
      categories: ["grocery", "education", "hidden-category"],
    });
  });

  it("tolerates malformed config JSON", () => {
    expect(referencedSlugs([{ key: "x", type: "SERVICES", titleBn: "x", config: "oops" }])).toEqual(
      {
        services: [],
        categories: [],
      },
    );
  });
});

describe("resolveHomeSections", () => {
  const sections = resolveHomeSections(rows, services, categories);

  it("keeps configured order and drops unknown section types", () => {
    expect(sections.map((s) => s.key)).toEqual([
      "quick_actions",
      "popular_services",
      "local_products",
      "protutors",
      "recent_listings",
    ]);
  });

  it("keeps only known quick actions", () => {
    expect(sections[0]).toMatchObject({
      kind: "QUICK_ACTIONS",
      actions: ["custom-request", "ambulance"],
    });
  });

  it("resolves services in config order, skipping missing/inactive ones", () => {
    expect(sections[1]).toMatchObject({ kind: "SERVICES" });
    expect(sections[1]?.kind === "SERVICES" && sections[1].services.map((s) => s.slug)).toEqual([
      "c",
      "a",
    ]);
  });

  it("renders the education spotlight as the branded ProTutors block (D-18)", () => {
    expect(sections[3]).toMatchObject({ kind: "PROTUTORS", category: { slug: "education" } });
  });

  it("drops spotlights whose category is gone", () => {
    expect(sections.find((s) => s.key === "gone")).toBeUndefined();
  });

  it("clamps the listing limit", () => {
    expect(sections.at(-1)).toMatchObject({ kind: "LISTINGS", limit: 24 });
  });

  it("drops a services section when none of its services exist", () => {
    const [only] = [{ key: "s", type: "SERVICES", titleBn: "s", config: { serviceSlugs: ["x"] } }];
    expect(resolveHomeSections([only], services, categories)).toEqual([]);
  });
});
