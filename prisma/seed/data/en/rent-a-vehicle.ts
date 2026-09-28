import type { EnglishCatalog, EnglishEntry } from "./types";

const rentalFaqs = (vehicle: string) => [
  {
    q: `How is the ${vehicle} fare decided?`,
    a: "Our team tells you the fare by phone based on distance, time and the type of trip (one way, return, full day).",
  },
  {
    q: "Can I travel outside Bogura?",
    a: "Yes. Type the destination — trips to Dhaka, Rajshahi or any district can be arranged.",
  },
  {
    q: "How far ahead should I request?",
    a: "At least a few hours ahead; during Eid or the wedding season, requesting 1–2 days early makes it easier to get a vehicle.",
  },
];

const rental = (vehicle: string, entry: Omit<EnglishEntry, "faqs">): EnglishEntry => ({
  ...entry,
  faqs: rentalFaqs(vehicle),
});

export const rentAVehicleEn: EnglishCatalog = {
  "rent-a-vehicle": {
    shortDesc: "Car, CNG, pickup, van and truck rental",
    body: "Easily rent a vehicle from Bogura to carry passengers or goods anywhere. Private car, micro, CNG, pickup, van or truck — tell us where from, where to and when, and our team will arrange the right vehicle.",
    faqs: [
      {
        q: "Does the vehicle come with a driver?",
        a: "Yes, every rental comes with a driver.",
      },
      {
        q: "Who pays for fuel and tolls?",
        a: "Fuel is usually included in the fare; tolls, parking or ferry costs are extra — we'll tell you when confirming the fare.",
      },
      {
        q: "Do I need to pay in advance?",
        a: "Long-distance or multi-day trips may need a small advance; we'll explain by phone.",
      },
    ],
  },
  "rent-a-car": rental("car", {
    shortDesc: "AC cars and microbuses — for weddings, trips and office work",
    body: "Rent a private car or microbus from Bogura for weddings, family trips, hospital visits or office work. AC or non-AC, a sedan or a 7–11 seat micro — just tell us what you need.",
  }),
  "rent-a-cng": rental("CNG", {
    shortDesc: "Reserve a CNG for travel in and around town",
    body: "Reserve a CNG for travel in Bogura town or nearby upazilas — by the hour or one way.",
  }),
  "rent-a-pickup": rental("pickup", {
    shortDesc: "A pickup for small loads and moving house",
    body: "Rent a pickup in Bogura for furniture, shop goods or a small house move. Loaders can come along if needed.",
  }),
  "rent-a-van": rental("van", {
    shortDesc: "Short-distance transport for goods and passengers",
    body: "Rent a van at a low cost to carry goods or passengers over short distances in town.",
  }),
  "rent-a-truck": rental("truck", {
    shortDesc: "1 to 7.5 ton trucks and covered vans",
    body: "Paddy and rice, building materials, factory goods or a whole household — rent a truck or covered van from Bogura to anywhere in the country.",
  }),
};
