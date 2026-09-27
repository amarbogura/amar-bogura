import { defineTemplate } from "./_helpers";

/** Other items: only the common listing columns (title, description, price, photos…). */
export const listingOther = defineTemplate({
  key: "listing_other",
  name: "অন্যান্য (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: anything else — description only",
  schema: { schemaVersion: 1, kind: "LISTING", common: {}, sections: [] },
});
