const { category } = vi.hoisted(() => ({ category: { findMany: vi.fn() } }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { category } }));

import { getHomeCategories } from "./queries";
import { MAX_HOME_CATEGORIES } from "./sections";

describe("getHomeCategories", () => {
  it("asks for active, home-visible categories in rank order, capped at 12", async () => {
    category.findMany.mockResolvedValue([]);
    await getHomeCategories();
    expect(MAX_HOME_CATEGORIES).toBe(12);
    expect(category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "ACTIVE", showOnHome: true },
        orderBy: { sortOrder: "asc" },
        take: 12,
      }),
    );
  });
});
