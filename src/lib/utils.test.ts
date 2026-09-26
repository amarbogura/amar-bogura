import { cn } from "./utils";

describe("cn", () => {
  it("joins conditional classes", () => {
    const hidden = false;
    expect(cn("px-2", hidden && "hidden", undefined, "py-1")).toBe("px-2 py-1");
  });

  it("resolves conflicting Tailwind classes, last wins", () => {
    expect(cn("bg-primary px-2", "px-4")).toBe("bg-primary px-4");
  });
});
