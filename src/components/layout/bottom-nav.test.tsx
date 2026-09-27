import { render, screen } from "@testing-library/react";

const { useSession, pathname } = vi.hoisted(() => ({
  useSession: vi.fn(),
  pathname: { current: "/" },
}));

vi.mock("@/lib/auth-client", () => ({ authClient: { useSession } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

import { BottomNav, bottomNavTabs, isTabActive } from "./bottom-nav";

describe("bottom nav tabs", () => {
  it("has the five docs/01 §4 tabs in order", () => {
    expect(bottomNavTabs(false).map((t) => t.label)).toEqual([
      "হোম",
      "খুঁজুন",
      "রিকোয়েস্ট",
      "Buy & Sell",
      "প্রোফাইল",
    ]);
  });

  it("sends guests to /track and /login, users to my requests and profile", () => {
    const guest = bottomNavTabs(false);
    const user = bottomNavTabs(true);
    expect(guest[2]!.href).toBe("/track");
    expect(user[2]!.href).toBe("/account/requests");
    expect(guest[4]!.href).toBe("/login");
    expect(user[4]!.href).toBe("/account");
  });

  it("matches home exactly and others by prefix", () => {
    const [home, , requests] = bottomNavTabs(true);
    expect(isTabActive(home!, "/")).toBe(true);
    expect(isTabActive(home!, "/buy-sell")).toBe(false);
    expect(isTabActive(requests!, "/account/requests/AB-1")).toBe(true);
    expect(isTabActive(requests!, "/account/requestsX")).toBe(false);
  });
});

describe("<BottomNav />", () => {
  it("marks exactly one tab as the current page", () => {
    useSession.mockReturnValue({ data: { user: { id: "u" } }, isPending: false });
    pathname.current = "/account/requests";
    render(<BottomNav />);
    const current = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("রিকোয়েস্ট");
  });
});
