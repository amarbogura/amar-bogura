const updateMany = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { serviceRequest: { updateMany } } }));

import { linkGuestRequests } from "./guest-linking";

describe("linkGuestRequests (D-03)", () => {
  it("attaches only unowned requests with the verified phone", async () => {
    updateMany.mockResolvedValue({ count: 2 });
    await expect(linkGuestRequests("user_1", "+8801712345678")).resolves.toBe(2);
    expect(updateMany).toHaveBeenCalledWith({
      where: { userId: null, contactPhone: "+8801712345678" },
      data: { userId: "user_1" },
    });
  });
});
