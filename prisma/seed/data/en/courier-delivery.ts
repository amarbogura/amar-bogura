import type { EnglishCatalog } from "./types";

export const courierDeliveryEn: EnglishCatalog = {
  "courier-delivery": {
    shortDesc: "Parcels, documents and shop-to-home delivery",
    body: "Send parcels, papers or shop goods from one place to another within Bogura town on the same day. Give the sender's and recipient's addresses and we'll pick up and deliver — and collect payment from the recipient if needed.",
    faqs: [
      {
        q: "How long does delivery take?",
        a: "Regular delivery is same-day; choose express for delivery within 2–3 hours.",
      },
      {
        q: "Is cash on delivery possible?",
        a: "Yes, for shop-to-home deliveries we collect the money from the recipient and hand it over to you.",
      },
      {
        q: "What can't be sent?",
        a: "Illegal, flammable or dangerous items and cash cannot be sent as parcels.",
      },
    ],
  },
  "parcel-delivery": {
    shortDesc: "Small and large parcels within town, same day",
    body: "Deliver gifts, online orders or any parcel within Bogura town on the same day. Just give the pickup time and the recipient's details.",
    faqs: [
      {
        q: "Can I send fragile items?",
        a: "Yes, choose 'Fragile item' in the form and it's carried with extra care.",
      },
      {
        q: "How is the delivery charge decided?",
        a: "It depends on distance, weight and speed (regular/express); we tell you when confirming.",
      },
      {
        q: "Will I be told when it's delivered?",
        a: "Yes, the request status is updated and our team lets you know.",
      },
    ],
  },
  "document-delivery": {
    shortDesc: "Important papers, fast and safe",
    body: "Deliver urgent office, bank or court papers quickly and safely within Bogura town.",
    faqs: [
      {
        q: "Can I send a sealed envelope?",
        a: "Yes, sealed envelopes are never opened and are handed directly to the recipient.",
      },
      {
        q: "Do you take proof of delivery?",
        a: "If needed, we can send a photo of the recipient's signature — mention it in the notes.",
      },
      {
        q: "Do you deliver after office hours?",
        a: "Mention a specific time in the form and we'll deliver then if possible.",
      },
    ],
  },
  "local-pickup-drop": {
    shortDesc: "People or things from one place to another",
    body: "Bringing a child home from school, taking an elderly person to hospital or fetching something — request a local pick-up and drop in Bogura.",
    faqs: [
      {
        q: "Can I book it every day?",
        a: "Yes, mention a regular need in the notes and we'll discuss a monthly arrangement.",
      },
      {
        q: "Is a return trip possible?",
        a: "Yes, choose 'I need a return trip too' in the form.",
      },
      {
        q: "Which vehicle is used?",
        a: "A rickshaw, CNG or car, depending on the distance and your needs.",
      },
    ],
  },
  "shop-to-home-delivery": {
    shortDesc: "Cash on delivery for shops and online sellers",
    body: "Shopkeepers and online sellers in Bogura can send products to customers' homes — we collect the money from the recipient and hand it over to you.",
    faqs: [
      {
        q: "When will I get the collected money?",
        a: "After delivery our team contacts you and hands over the money; regular sellers can discuss a separate arrangement.",
      },
      {
        q: "What if the customer doesn't take the product?",
        a: "It's returned to you; the return cost is told in advance.",
      },
      {
        q: "Can I send several deliveries a day?",
        a: "Yes, send a separate request for each delivery or list them in the notes.",
      },
    ],
  },
};
