import { parseFaqs } from "./faqs";

describe("parseFaqs", () => {
  it("keeps valid entries and trims them", () => {
    expect(parseFaqs([{ q: " প্রশ্ন? ", a: " উত্তর। " }])).toEqual([{ q: "প্রশ্ন?", a: "উত্তর।" }]);
  });

  it("drops malformed entries instead of failing the page", () => {
    expect(parseFaqs([{ q: "ok?", a: "yes" }, { q: "", a: "x" }, { q: 1 }, "text", null])).toEqual([
      { q: "ok?", a: "yes" },
    ]);
  });

  it.each([null, undefined, "[]", {}, 3])("returns [] for non-array %j", (value) => {
    expect(parseFaqs(value)).toEqual([]);
  });
});
