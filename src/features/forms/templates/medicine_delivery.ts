import { defineTemplate, options } from "./_helpers";

/** Emergency medicine delivery (service is HIGH priority). */
export const medicineDelivery = defineTemplate({
  key: "medicine_delivery",
  name: "জরুরি ওষুধ ডেলিভারি",
  kind: "REQUEST",
  description: "Emergency medicine delivery",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "required",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    notice: {
      bn: "প্রেসক্রিপশন ছাড়া প্রেসক্রিপশন-ওষুধ সরবরাহ করা হবে না।",
      en: "Prescription medicines are not delivered without a prescription.",
    },
    rules: [
      {
        type: "requireOneOf",
        fields: ["prescription", "medicines"],
        message: {
          bn: "প্রেসক্রিপশনের ছবি অথবা ওষুধের তালিকা দিন।",
          en: "Add a prescription photo or a list of medicines.",
        },
      },
    ],
    sections: [
      {
        key: "medicines",
        title: { bn: "কোন ওষুধ লাগবে", en: "Which medicines do you need?" },
        description: {
          bn: "প্রেসক্রিপশনের ছবি অথবা ওষুধের তালিকা — যেকোনো একটি দিন।",
          en: "Add a photo of the prescription or a list of medicines — either one.",
        },
        fields: [
          {
            key: "prescription",
            type: "images",
            label: { bn: "প্রেসক্রিপশনের ছবি", en: "Prescription photo" },
            help: {
              bn: "প্রেসক্রিপশন-ওষুধের জন্য অবশ্যই দিতে হবে।",
              en: "Required for prescription medicines.",
            },
            validation: { maxFiles: 3 },
          },
          {
            key: "medicines",
            type: "item_list",
            label: { bn: "ওষুধের তালিকা", en: "List of medicines" },
            validation: { min: 1, max: 30, units: ["pcs", "strip", "box", "bottle"] },
          },
          {
            key: "urgency",
            type: "radio",
            label: { bn: "কখন লাগবে", en: "When do you need it?" },
            required: true,
            summary: true,
            options: options([
              ["within_1h", "১ ঘণ্টার মধ্যে", "Within 1 hour"],
              ["today", "আজকের মধ্যে", "Today"],
            ]),
          },
          {
            key: "patientName",
            type: "text",
            label: { bn: "রোগীর নাম", en: "Patient name" },
            validation: { maxLength: 60 },
          },
        ],
      },
    ],
  },
});
