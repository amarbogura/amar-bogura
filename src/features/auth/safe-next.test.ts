import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it.each([
    ["/account/requests", "/account/requests"],
    ["/services/electrician?x=1", "/services/electrician?x=1"],
    [undefined, "/account"],
    ["", "/account"],
    ["https://evil.example", "/account"],
    ["//evil.example", "/account"],
    ["/\\evil.example", "/account"],
    ["javascript:alert(1)", "/account"],
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it("uses the first value of repeated params", () => {
    expect(safeNext(["/a", "/b"])).toBe("/a");
  });
});
