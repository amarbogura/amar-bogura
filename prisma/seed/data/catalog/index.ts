import type { CategorySeed } from "../types";
import { bazarMedicine } from "./bazar-medicine";
import { buySell } from "./buy-sell";
import { courierDelivery } from "./courier-delivery";
import { customRequest } from "./custom-request";
import { education } from "./education";
import { emergency } from "./emergency";
import { homeOffice } from "./home-office";
import { itDigital } from "./it-digital";
import { localProductsGrocery } from "./local-products-grocery";
import { property } from "./property";
import { rentAVehicle } from "./rent-a-vehicle";
import { weddingEvent } from "./wedding-event";

/** The 12 homepage parent categories, in homepage order (docs/03 §6). */
export const categories: CategorySeed[] = [
  homeOffice,
  rentAVehicle,
  courierDelivery,
  buySell,
  localProductsGrocery,
  bazarMedicine,
  weddingEvent,
  education,
  emergency,
  property,
  itDigital,
  customRequest,
];
