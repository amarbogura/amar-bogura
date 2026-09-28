// English content for the seeded catalog (D-17), keyed by category / service / listing-category
// slug. `validateSeedData` checks every seeded slug has its English here.
import { bazarMedicineEn } from "./bazar-medicine";
import { courierDeliveryEn } from "./courier-delivery";
import { homeOfficeEn } from "./home-office";
import { itDigitalEn } from "./it-digital";
import { localProductsGroceryEn } from "./local-products-grocery";
import { buySellEn, customRequestEn, educationEn, emergencyEn, propertyEn } from "./other";
import { rentAVehicleEn } from "./rent-a-vehicle";
import type { EnglishCatalog } from "./types";
import { weddingEventEn } from "./wedding-event";

export const englishCatalog: EnglishCatalog = {
  ...homeOfficeEn,
  ...rentAVehicleEn,
  ...courierDeliveryEn,
  ...localProductsGroceryEn,
  ...bazarMedicineEn,
  ...weddingEventEn,
  ...educationEn,
  ...emergencyEn,
  ...itDigitalEn,
  ...customRequestEn,
  ...buySellEn,
  ...propertyEn,
};

export type { EnglishCatalog, EnglishEntry } from "./types";
