// English for the smaller catalog files: emergency, education, custom request, Buy & Sell, Property.
import type { EnglishCatalog } from "./types";

export const emergencyEn: EnglishCatalog = {
  emergency: {
    shortDesc: "Ambulance — call or request right now",
    body: "In an emergency the fastest way is to call directly. If you need an ambulance from Bogura to any hospital or city, call the hotline or fill in the short form — no login needed.",
    faqs: [
      {
        q: "Can I request an ambulance without logging in?",
        a: "Yes. Just give a name and mobile number, or call the hotline directly.",
      },
      {
        q: "What should I do in a life-threatening emergency?",
        a: "Call the National Emergency Service on 999 immediately, then our hotline.",
      },
      {
        q: "How quickly will you respond after a request?",
        a: "Emergency requests are handled first and our team calls you right away.",
      },
    ],
  },
  ambulance: {
    shortDesc: "AC, non-AC, ICU and freezer ambulances",
    body: "Ambulances to take patients from Bogura to SZMCH, Dhaka or any hospital in the country — non-AC, AC, ICU, oxygen support and freezer ambulances. In an emergency, use the call button above to call directly.",
    faqs: [
      {
        q: "What does an ICU ambulance have?",
        a: "Oxygen, a monitor and essential emergency equipment; a trained attendant on request.",
      },
      {
        q: "Can it go to Dhaka or another district?",
        a: "Yes, type the destination in the form; the fare is told by phone based on the distance.",
      },
      {
        q: "Can I book in advance?",
        a: "Yes, choose 'At a set time' and give the date and time — for example on the day of discharge from hospital.",
      },
    ],
  },
};

export const educationEn: EnglishCatalog = {
  education: {
    shortDesc: "Home tutors — from play group to university",
    body: "Looking for a qualified home tutor for your child in Bogura? Request one with the class, medium, subjects and budget — the ProTutors Bogura team will connect you with a suitable tutor.",
    faqs: [
      {
        q: "Who are the tutors?",
        a: "Mainly university and college students and experienced teachers in Bogura; share your preference in the form.",
      },
      {
        q: "What if I don't like the tutor?",
        a: "Tell us if there's a problem after the first few classes and we'll try to arrange another tutor.",
      },
      {
        q: "How is the fee decided?",
        a: "It depends on the class, subjects and days per week; give your budget in the form.",
      },
    ],
  },
  "home-tutor": {
    shortDesc: "Qualified tutors who teach at your home",
    body: "Play group to HSC, admission preparation, O/A levels or madrasa — request a qualified tutor to teach at your home in Bogura. Tell us whether you prefer a male or female tutor, the days per week and your budget.",
    faqs: [
      {
        q: "How soon will I get a tutor?",
        a: "Usually we contact you within a few days with a tutor's profile.",
      },
      {
        q: "Can siblings be taught together?",
        a: "Yes, give the number of students in the form; the fee is set accordingly.",
      },
      {
        q: "What if I want a student from a specific institution?",
        a: "Choose 'From a specific institution' in the form and type its name, e.g. Govt. Azizul Haque College.",
      },
    ],
  },
};

export const customRequestEn: EnglishCatalog = {
  "custom-request": {
    shortDesc: "Not listed? Tell us what you need",
    body: "Can't find the service you're looking for? Describe any lawful need — our team will contact you to arrange it in Bogura. We launch new services based on the requests we see most often.",
    faqs: [
      {
        q: "What kind of requests can I make?",
        a: "Any lawful job — for example a carpenter, gas stove repair, water tank cleaning and so on.",
      },
      {
        q: "Can every request be fulfilled?",
        a: "We try; if it isn't possible, we'll tell you why.",
      },
      {
        q: "How will I know the status of my request?",
        a: "Track it with the request code, or log in with the same number to see it.",
      },
    ],
  },
};

export const buySellEn: EnglishCatalog = {
  "buy-sell": {
    shortDesc: "Buy and sell phones, furniture, electronics, bikes and cars",
    body: "Buy and sell new and used items with people in your own area of Bogura. Post ads for phones, laptops, furniture, electronics, motorcycles and cars — every ad is checked before it goes live.",
    faqs: [
      {
        q: "Does it cost anything to post an ad?",
        a: "No, posting ads is currently completely free. You just log in and verify your mobile number.",
      },
      {
        q: "How long does an ad stay up?",
        a: "60 days after approval. After that you can renew it if you like.",
      },
      {
        q: "How can I avoid scams?",
        a: "Inspect items in person before buying and never send money in advance. Report suspicious ads with the 'Report' button.",
      },
    ],
  },
  "mobile-laptop": {
    body: "Buy and sell new and used phones, laptops, desktops, tablets and accessories in Bogura.",
  },
  furniture: {
    body: "Buy and sell home and office furniture — beds, sofas, almirahs, tables and chairs.",
  },
  electronics: {
    body: "Buy and sell TVs, fridges, ACs, washing machines, IPS units and other electronics.",
  },
  bike: {
    body: "Buy and sell new and used motorcycles in Bogura — with details of the papers.",
  },
  car: {
    body: "Buy and sell private cars, micros and other vehicles.",
  },
  others: {
    body: "Buy and sell any other lawful item.",
  },
};

export const propertyEn: EnglishCatalog = {
  property: {
    shortDesc: "Houses and flats to rent, shops and offices to rent, land and houses for sale",
    body: "Looking for a house or flat to rent in Bogura, want to let a shop or office, or selling land or a house? Search by area, rent or price and number of rooms, or post your own property — every ad is checked before it goes live.",
    faqs: [
      {
        q: "What do I need to post a property ad?",
        a: "Log in, verify your mobile number, then submit the ad with photos and details.",
      },
      {
        q: "Can I talk to the owner directly, without a broker?",
        a: "You can contact the number in the ad directly; log in to see the number.",
      },
      {
        q: "What should I check before buying land?",
        a: "Check the deed, khatian, mutation and up-to-date land tax papers, and consult a lawyer if needed.",
      },
    ],
  },
  "house-flat-rent": {
    body: "Houses, flats and rooms to rent in Bogura town for families or bachelors — in every area, including Satmatha, Maltinagar, Jaleshwaritala and Sherpur Road.",
  },
  "office-shop-rent": {
    body: "Office space, shops and commercial space for rent in Bogura.",
  },
  "land-sale": {
    body: "Residential, commercial and agricultural land for sale in Bogura district — by decimal, katha or bigha.",
  },
  "house-sale": {
    body: "Ready houses and flats for sale in Bogura.",
  },
  "other-property-sale": {
    body: "Shops, markets, godowns and other commercial property for sale.",
  },
};
