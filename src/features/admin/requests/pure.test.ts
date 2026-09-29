import { RequestStatus } from "@/generated/prisma/enums";

import { csvCell, toCsv } from "./csv";
import { activeView, parseRequestFilters, SAVED_VIEWS, serializeRequestFilters } from "./filters";
import { allowedNext, canTransition, isClosed, requiresMessage } from "./transitions";

const ALL = Object.values(RequestStatus);

describe("canTransition", () => {
  it("lets admins walk the happy path one step at a time", () => {
    expect(canTransition("NEW", "REVIEWING", "admin")).toBe(true);
    expect(canTransition("REVIEWING", "PROCESSING", "admin")).toBe(true);
    expect(canTransition("PROCESSING", "COMPLETED", "admin")).toBe(true);
    expect(canTransition("NEW", "PROCESSING", "admin")).toBe(false);
    expect(canTransition("NEW", "COMPLETED", "admin")).toBe(false);
  });

  it("allows rejecting any open request and cancelling only before work starts", () => {
    for (const from of ["NEW", "REVIEWING", "PROCESSING"] as const) {
      expect(canTransition(from, "REJECTED", "admin")).toBe(true);
    }
    expect(canTransition("NEW", "CANCELLED", "admin")).toBe(true);
    expect(canTransition("REVIEWING", "CANCELLED", "admin")).toBe(true);
    expect(canTransition("PROCESSING", "CANCELLED", "admin")).toBe(false);
  });

  it("never reopens a closed request", () => {
    for (const from of ["COMPLETED", "REJECTED", "CANCELLED"] as const) {
      expect(isClosed(from)).toBe(true);
      for (const to of ALL) expect(canTransition(from, to, "admin")).toBe(false);
    }
  });

  it("users may only cancel NEW/REVIEWING", () => {
    const moves = ALL.flatMap((from) => allowedNext(from, "user").map((to) => `${from}->${to}`));
    expect(moves).toEqual(["NEW->CANCELLED", "REVIEWING->CANCELLED"]);
  });

  it("requires a customer message to reject, and to cancel on the customer's behalf", () => {
    expect(requiresMessage("REJECTED", "admin")).toBe(true);
    expect(requiresMessage("CANCELLED", "admin")).toBe(true);
    expect(requiresMessage("CANCELLED", "user")).toBe(false);
    expect(requiresMessage("REVIEWING", "admin")).toBe(false);
  });
});

describe("request filters", () => {
  it("round-trips through the URL and drops invalid values", () => {
    const filters = parseRequestFilters({
      status: "NEW",
      priority: "SUPER",
      q: " 01712345678 ",
      from: "2026-09-01",
      to: "not-a-date",
      page: "3",
      unknown: "x",
    });
    expect(filters).toEqual({ status: "NEW", q: "01712345678", from: "2026-09-01", page: 3 });
    expect(serializeRequestFilters(filters)).toBe(
      "?status=NEW&from=2026-09-01&q=01712345678&page=3",
    );
    expect(serializeRequestFilters({ page: 1 })).toBe("");
  });

  it("recognises saved views regardless of paging", () => {
    expect(activeView({ status: "NEW", page: 2 })).toBe("new");
    expect(activeView({})).toBe("all");
    expect(activeView({ status: "NEW", priority: "HIGH" })).toBeNull();
    expect(Object.keys(SAVED_VIEWS)).toEqual(["new", "emergency", "mine", "spam", "all"]);
  });
});

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(1500)).toBe("1500");
  });

  it("defuses spreadsheet formulas (CSV injection)", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+8801712345678")).toBe("'+8801712345678");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("starts with a BOM and uses CRLF rows (Excel shows Bangla)", () => {
    const csv = toCsv(["কোড", "নাম"], [["AB-1", "রহিম"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿কোড,নাম\r\nAB-1,রহিম\r\n");
  });
});
