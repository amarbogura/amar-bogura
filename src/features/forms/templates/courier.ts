import { defineTemplate, options } from "./_helpers";

/** Parcel, document and shop-to-home delivery. */
export const courier = defineTemplate({
  key: "courier",
  name: "কুরিয়ার ও ডেলিভারি",
  kind: "REQUEST",
  description: "Local courier: parcel, document, shop-to-home (COD)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "hidden",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "optional",
      altPhone: "optional",
    },
    sections: [
      {
        key: "item",
        title: { bn: "কী পাঠাবেন", en: "Item" },
        fields: [
          {
            key: "itemType",
            type: "radio",
            label: { bn: "জিনিসের ধরন", en: "Item type" },
            required: true,
            summary: true,
            options: options([
              ["document", "ডকুমেন্ট / কাগজপত্র", "Document"],
              ["small_parcel", "ছোট পার্সেল", "Small parcel"],
              ["large_parcel", "বড় পার্সেল", "Large parcel"],
              ["fragile", "ভঙ্গুর জিনিস", "Fragile"],
              ["food", "খাবার", "Food"],
            ]),
          },
          {
            key: "approxWeight",
            type: "select",
            label: { bn: "আনুমানিক ওজন", en: "Approx. weight" },
            options: options([
              ["lt_1kg", "১ কেজির কম", "< 1 kg"],
              ["1_5kg", "১–৫ কেজি", "1–5 kg"],
              ["5_10kg", "৫–১০ কেজি", "5–10 kg"],
              ["gt_10kg", "১০ কেজির বেশি", "10 kg+"],
            ]),
          },
        ],
      },
      {
        key: "pickup",
        title: { bn: "কোথা থেকে নেবো", en: "Pickup" },
        fields: [
          {
            key: "sender",
            type: "person",
            label: { bn: "প্রেরকের নাম ও ফোন", en: "Sender" },
            required: true,
          },
          {
            key: "pickupAddress",
            type: "address",
            label: { bn: "পিকআপ ঠিকানা", en: "Pickup address" },
            required: true,
          },
          {
            key: "pickupTime",
            type: "datetime",
            label: { bn: "কখন পিকআপ করবো", en: "Pickup time" },
            required: true,
            summary: true,
          },
        ],
      },
      {
        key: "drop",
        title: { bn: "কোথায় পৌঁছাবো", en: "Drop" },
        fields: [
          {
            key: "recipient",
            type: "person",
            label: { bn: "প্রাপকের নাম ও ফোন", en: "Recipient" },
            required: true,
          },
          {
            key: "dropAddress",
            type: "address",
            label: { bn: "ডেলিভারি ঠিকানা", en: "Drop address" },
            required: true,
          },
          {
            key: "speed",
            type: "radio",
            label: { bn: "ডেলিভারির গতি", en: "Speed" },
            options: options([
              ["regular", "সাধারণ (একই দিনে)", "Regular (same day)"],
              ["express", "এক্সপ্রেস (২–৩ ঘণ্টায়)", "Express (2–3 hrs)"],
            ]),
          },
          {
            key: "collectCash",
            type: "boolean",
            label: {
              bn: "প্রাপকের কাছ থেকে টাকা তুলতে হবে (ক্যাশ অন ডেলিভারি)",
              en: "Collect cash",
            },
          },
          {
            key: "cashAmount",
            type: "money",
            label: { bn: "কত টাকা তুলতে হবে", en: "Cash amount" },
            required: true,
            validation: { min: 1, max: 500000 },
            showIf: { field: "collectCash", op: "truthy" },
          },
        ],
      },
    ],
  },
});
