import type { Faq } from "../types";
import type { EnglishCatalog } from "./types";

const groceryFaqs: Faq[] = [
  {
    q: "How do I pay?",
    a: "Cash on delivery — pay when you receive the goods. No online payment is needed.",
  },
  {
    q: "Can I order regularly (daily/weekly)?",
    a: "Yes, choose how often and for how many days in the form.",
  },
  {
    q: "What if an item isn't available?",
    a: "Choose your preference in the form — call you, give a similar item, or leave it out.",
  },
];

export const localProductsGroceryEn: EnglishCatalog = {
  "local-products-grocery": {
    shortDesc: "Pure milk, fresh vegetables, Bogura doi and daily essentials",
    body: "Pure milk from Bogura's farms, fresh vegetables from the local market, the famous doi and sweets, and everyday household items — send your list and it's delivered to your door. Once or every day, as you need.",
    faqs: groceryFaqs,
  },
  "fresh-milk": {
    shortDesc: "Pure cow's milk from the farm, every morning",
    body: "Unadulterated cow's milk from Bogura farms, delivered to your home every morning. Tell us how many litres and for how many days.",
    faqs: [
      {
        q: "When is the milk delivered?",
        a: "Usually every morning; choose your preferred time in the last step.",
      },
      {
        q: "Is the milk pure?",
        a: "We aim to deliver milk from local farms with no added water or adulterants; tell us right away if there's a problem.",
      },
      {
        q: "Can I pause for a few days?",
        a: "Yes, just call the day before or add a note to the request.",
      },
    ],
  },
  "fresh-vegetables": {
    shortDesc: "Fresh vegetables and fruit from the local market",
    body: "Fresh vegetables and seasonal fruit, hand-picked from Bogura's local markets and delivered to your home.",
    faqs: [
      {
        q: "Are the vegetables bought from that day's market?",
        a: "Yes, they're picked and bought at the market on the day of your order.",
      },
      {
        q: "How do I write the quantities?",
        a: "Add each vegetable's name, quantity and unit (kg, hali, piece) to the list.",
      },
      {
        q: "What if some vegetables are bad?",
        a: "Check them at delivery and tell us right away if there's a problem.",
      },
    ],
  },
  "local-products": {
    shortDesc: "Bogura's doi, sweets, ghee and local products",
    body: "Order Bogura's famous doi, sweets, pure ghee and other local products — for gifts or events too.",
    faqs: [
      {
        q: "Can Bogura doi be sent outside the district?",
        a: "We currently deliver within Bogura district; to send it elsewhere, see the courier service.",
      },
      {
        q: "Can I order large quantities for an event?",
        a: "Yes, preferably at least 1–2 days in advance.",
      },
      {
        q: "Can you buy from a shop I prefer?",
        a: "Yes, write the shop's name in the notes.",
      },
    ],
  },
  "packaged-grocery": {
    shortDesc: "Rice, lentils, oil, spices and packaged goods",
    body: "Rice, lentils, oil, sugar, spices and packaged food — send your monthly grocery list and it will be delivered to your home.",
    faqs: [
      {
        q: "What if I want a specific brand?",
        a: "Write the brand name next to the item in the list.",
      },
      {
        q: "Can I order in bulk?",
        a: "Yes, you can order the whole month's groceries at once.",
      },
      {
        q: "How will I know the price?",
        a: "After purchase, we tell you the price from the receipt plus the delivery charge.",
      },
    ],
  },
  "daily-essentials": {
    shortDesc: "Soap, tissues, detergent and household needs",
    body: "Soap, shampoo, detergent, tissues and everyday household items delivered in one order.",
    faqs: [
      {
        q: "Do you take small orders?",
        a: "Yes, though the delivery charge may feel relatively high on a small order.",
      },
      {
        q: "Can I get baby diapers and formula?",
        a: "Yes, write the brand and size in the list.",
      },
      {
        q: "Can it be delivered regularly?",
        a: "Yes, choose weekly or monthly.",
      },
    ],
  },
};
