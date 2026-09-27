import type { FormTemplateSeed } from "../types";
import { acService } from "./ac_service";
import { ambulance } from "./ambulance";
import { bazar } from "./bazar";
import { cctv } from "./cctv";
import { courier } from "./courier";
import { customRequest } from "./custom_request";
import { digitalService } from "./digital_service";
import { electrician } from "./electrician";
import { eventDecoration } from "./event_decoration";
import { eventMedia } from "./event_media";
import { fbAds } from "./fb_ads";
import { genericService } from "./generic_service";
import { graphics } from "./graphics";
import { groceryOrder } from "./grocery_order";
import { homeShifting } from "./home_shifting";
import { homeTutor } from "./home_tutor";
import { influencer } from "./influencer";
import { listingBike } from "./listing_bike";
import { listingCar } from "./listing_car";
import { listingElectronics } from "./listing_electronics";
import { listingFurniture } from "./listing_furniture";
import { listingMobileComputer } from "./listing_mobile_computer";
import { listingOther } from "./listing_other";
import { listingPropertyRent } from "./listing_property_rent";
import { listingPropertySale } from "./listing_property_sale";
import { makeup } from "./makeup";
import { medicineDelivery } from "./medicine_delivery";
import { mehendi } from "./mehendi";
import { painter } from "./painter";
import { pickupDrop } from "./pickup_drop";
import { plumber } from "./plumber";
import { seo } from "./seo";
import { softwareDev } from "./software_dev";
import { vehicleRent } from "./vehicle_rent";
import { videoEditing } from "./video_editing";
import { washingMachine } from "./washing_machine";
import { webDev } from "./web_dev";

/** Every template seeded as FormTemplate + FormTemplateVersion v1 (docs/03 §4–5). */
export const formTemplates: readonly FormTemplateSeed[] = [
  // Requests
  homeShifting,
  electrician,
  acService,
  washingMachine,
  plumber,
  painter,
  cctv,
  vehicleRent,
  courier,
  pickupDrop,
  groceryOrder,
  bazar,
  medicineDelivery,
  eventMedia,
  makeup,
  mehendi,
  eventDecoration,
  homeTutor,
  ambulance,
  digitalService,
  fbAds,
  seo,
  videoEditing,
  webDev,
  softwareDev,
  graphics,
  influencer,
  customRequest,
  genericService,
  // Listing attributes
  listingMobileComputer,
  listingFurniture,
  listingElectronics,
  listingBike,
  listingCar,
  listingOther,
  listingPropertyRent,
  listingPropertySale,
];

export function getTemplate(key: string): FormTemplateSeed | undefined {
  return formTemplates.find((template) => template.key === key);
}
