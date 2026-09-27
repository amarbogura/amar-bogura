import "@testing-library/jest-dom/vitest";

// jsdom has no layout: stub scrolling used by multi-step forms.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
