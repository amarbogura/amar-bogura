import type { EnglishCatalog } from "./types";

export const bazarMedicineEn: EnglishCatalog = {
  "bazar-medicine": {
    shortDesc: "Monthly bazar, bazar any time and urgent medicines",
    body: "Too busy to go to the market? In Bogura we'll do the shopping from your list and deliver it home. If you need medicine urgently, add a photo of the prescription — we'll try to deliver it quickly.",
    faqs: [
      {
        q: "How do I pay for the shopping?",
        a: "Our representative confirms the budget and any advance by phone; you pay the rest at delivery after checking the receipt.",
      },
      {
        q: "Can I send a photo of a handwritten list?",
        a: "Yes, if you'd rather not type the list, just add a photo of it.",
      },
      {
        q: "Do you deliver medicine without a prescription?",
        a: "Prescription medicines are not supplied without a prescription. Common medicines can be ordered with a list.",
      },
    ],
  },
  "monthly-bazar": {
    shortDesc: "The whole month's shopping, at once or split up",
    body: "We do the whole month's shopping based on your family size and list — all at once or split over several trips a month.",
    faqs: [
      {
        q: "Which market do you buy from?",
        a: "Give the name of your preferred market (e.g. Fateh Ali Bazar, Rajabazar); otherwise we use a good nearby market.",
      },
      {
        q: "Will I get a receipt?",
        a: "Yes, the purchase receipt or an account is handed over at delivery.",
      },
      {
        q: "Do I have to request again every month?",
        a: "For now, yes — a new request each month; our team can remind you of your previous list.",
      },
    ],
  },
  "bazar-on-demand": {
    shortDesc: "Today's shopping, for guests or a sudden need",
    body: "Guests turned up, or no time for today's shopping? Send your list and we'll buy it at a Bogura market and deliver it home.",
    faqs: [
      {
        q: "How soon will I get the shopping?",
        a: "Usually within a few hours of confirming the request; give your preferred time in the form.",
      },
      {
        q: "Do you buy fish and meat?",
        a: "Yes, write in the list how you'd like it cut.",
      },
      {
        q: "What if it goes over budget?",
        a: "If it goes over budget, the representative will call to ask you first.",
      },
    ],
  },
  "emergency-medicine": {
    shortDesc: "Add the prescription photo, the medicine comes to you",
    body: "Hard to get to a pharmacy at night or when you're unwell? In Bogura, add a photo of the prescription or a list of medicines — we'll arrange quick delivery.",
    faqs: [
      {
        q: "Can I get it within 1 hour?",
        a: "Usually yes within Bogura town; distant areas may take longer. The time is confirmed by phone.",
      },
      {
        q: "How do I pay for the medicine?",
        a: "Pay the pharmacy receipt amount plus the delivery charge at delivery.",
      },
      {
        q: "What if a medicine isn't available?",
        a: "The representative will call you, and no substitute is given without a doctor's advice.",
      },
    ],
  },
};
