import { canCompress, fitWithin } from "./compress";
import { cloudinaryUrl } from "./image-url";

describe("fitWithin", () => {
  it.each([
    [4000, 3000, { width: 1600, height: 1200 }],
    [3000, 4000, { width: 1200, height: 1600 }],
    [1600, 1600, { width: 1600, height: 1600 }],
    [800, 600, { width: 800, height: 600 }],
  ])("%ix%i → %o (never upscales)", (w, h, expected) => {
    expect(fitWithin(w, h)).toEqual(expected);
  });
});

describe("canCompress", () => {
  it("passes HEIC/HEIF and GIF through untouched", () => {
    expect(canCompress("image/heic")).toBe(false);
    expect(canCompress("image/heif")).toBe(false);
    expect(canCompress("image/gif")).toBe(false);
    expect(canCompress("image/jpeg")).toBe(true);
  });
});

describe("cloudinaryUrl", () => {
  const url =
    "https://res.cloudinary.com/demo/image/upload/v17/amar-bogura/prod/requests/u_1/abc.jpg";

  it("inserts f_auto,q_auto and sizing after /image/upload/", () => {
    expect(cloudinaryUrl(url, { width: 240, height: 240, crop: "fill" })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_fill,w_240,h_240/v17/amar-bogura/prod/requests/u_1/abc.jpg",
    );
  });

  it("leaves non-Cloudinary URLs alone", () => {
    expect(cloudinaryUrl("https://example.com/a.jpg", { width: 100 })).toBe(
      "https://example.com/a.jpg",
    );
  });
});
