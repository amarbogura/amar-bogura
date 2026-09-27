import { categories } from "../../prisma/seed/data/catalog";
import { ICONS, isIconKey } from "./icon";

describe("icon map", () => {
  const seeded = categories.flatMap((category) => [
    category.iconKey,
    ...(category.services ?? []).map((service) => service.iconKey),
    ...(category.listingCategories ?? []).map((listingCategory) => listingCategory.iconKey),
  ]);

  it.each([...new Set(seeded)])("covers seeded icon key %s", (key) => {
    expect(isIconKey(key)).toBe(true);
  });

  it("maps every key to a component", () => {
    for (const component of Object.values(ICONS)) expect(component).toBeTruthy();
  });
});
