import {
  isCodeConflict,
  nextRequestCode,
  normalizeRequestCode,
  requestCodePrefix,
  withCodeRetry,
} from "./code";

const fakeTx = (codes: string[]) => ({
  serviceRequest: {
    findMany: vi.fn(async ({ where }: { where: { code: { startsWith: string } } }) =>
      codes.filter((code) => code.startsWith(where.code.startsWith)).map((code) => ({ code })),
    ),
  },
});

describe("request codes", () => {
  it("uses the Dhaka calendar day (UTC+6), not UTC", () => {
    // 2026-09-28 19:30 UTC is already 29 Sep 01:30 in Dhaka.
    expect(requestCodePrefix(new Date("2026-09-28T19:30:00Z"))).toBe("AB-260929-");
    expect(requestCodePrefix(new Date("2026-09-28T17:59:00Z"))).toBe("AB-260928-");
  });

  it("starts each day at 0001 and increments the day's highest sequence", async () => {
    const now = new Date("2026-09-28T06:00:00Z");
    const tx = fakeTx([]);
    await expect(nextRequestCode(tx as never, now)).resolves.toBe("AB-260928-0001");
    await expect(
      nextRequestCode(fakeTx(["AB-260927-0450", "AB-260928-0009", "AB-260928-0012"]) as never, now),
    ).resolves.toBe("AB-260928-0013");
  });

  it("keeps working past 9999 in one day", async () => {
    const tx = fakeTx(["AB-260928-9999"]);
    await expect(nextRequestCode(tx as never, new Date("2026-09-28T06:00:00Z"))).resolves.toBe(
      "AB-260928-10000",
    );
  });

  it("normalizes typed codes and rejects anything else", () => {
    expect(normalizeRequestCode(" ab-260928-0012 ")).toBe("AB-260928-0012");
    expect(normalizeRequestCode("AB-2609-12")).toBeNull();
    expect(normalizeRequestCode("../admin")).toBeNull();
  });

  it("retries only on a code unique conflict, at most 3 times", async () => {
    const conflict = Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["code"] } });
    const run = vi.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce("ok");
    await expect(withCodeRetry(run)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);

    const always = vi.fn().mockRejectedValue(conflict);
    await expect(withCodeRetry(always)).rejects.toBe(conflict);
    expect(always).toHaveBeenCalledTimes(3);

    const other = vi.fn().mockRejectedValue(new Error("db down"));
    await expect(withCodeRetry(other)).rejects.toThrow("db down");
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("detects P2002 on the code column", () => {
    expect(isCodeConflict({ code: "P2002", meta: { target: ["code"] } })).toBe(true);
    expect(isCodeConflict({ code: "P2002" })).toBe(true);
    expect(isCodeConflict({ code: "P2002", meta: { target: ["publicId"] } })).toBe(false);
    expect(isCodeConflict({ code: "P2025" })).toBe(false);
  });
});
