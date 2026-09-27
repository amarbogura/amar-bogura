import { defineTemplate, options } from "./_helpers";

const vehicleIn = (...types: string[]) =>
  ({ field: "vehicleType", op: "in", value: types }) as const;

/** One template for all vehicle rentals; each service pins `vehicleType` via formPresets. */
export const vehicleRent = defineTemplate({
  key: "vehicle_rent",
  name: "গাড়ি ভাড়া",
  kind: "REQUEST",
  description: "Vehicle rental (vehicleType pinned per service)",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "hidden",
      preferredDate: "hidden",
      preferredTimeSlot: "hidden",
      notes: "optional",
      photos: "hidden",
      altPhone: "optional",
    },
    sections: [
      {
        key: "trip",
        title: { bn: "যাত্রার তথ্য", en: "Trip" },
        fields: [
          {
            key: "vehicleType",
            type: "select",
            label: { bn: "গাড়ির ধরন", en: "Vehicle type" },
            required: true,
            summary: true,
            options: options([
              ["car", "প্রাইভেট কার / মাইক্রো", "Car"],
              ["cng", "সিএনজি", "CNG"],
              ["pickup", "পিকআপ", "Pickup"],
              ["van", "ভ্যান", "Van"],
              ["truck", "ট্রাক", "Truck"],
            ]),
          },
          {
            key: "tripType",
            type: "radio",
            label: { bn: "যাত্রার ধরন", en: "Trip type" },
            required: true,
            summary: true,
            options: options([
              ["one_way", "শুধু যাওয়া", "One-way"],
              ["round", "যাওয়া-আসা", "Round trip"],
              ["day_long", "সারাদিনের জন্য", "Day-long"],
              ["multi_day", "একাধিক দিন", "Multi-day"],
              ["hourly", "ঘণ্টা হিসেবে", "Hourly"],
            ]),
          },
          {
            key: "route",
            type: "route",
            label: { bn: "কোথা থেকে কোথায়", en: "Pickup → destination" },
            help: { bn: "গন্তব্য বগুড়ার বাইরে হলে জায়গার নাম লিখে দিন।" },
            required: true,
          },
          {
            key: "startAt",
            type: "datetime",
            label: { bn: "কখন লাগবে", en: "Start" },
            required: true,
            summary: true,
            width: "half",
          },
          {
            key: "returnAt",
            type: "datetime",
            label: { bn: "কখন ফিরবেন", en: "Return" },
            required: true,
            width: "half",
            showIf: { field: "tripType", op: "in", value: ["round", "multi_day"] },
          },
          {
            key: "hours",
            type: "number",
            label: { bn: "কত ঘণ্টার জন্য", en: "Hours" },
            validation: { min: 1, max: 24 },
            showIf: { field: "tripType", op: "eq", value: "hourly" },
          },
        ],
      },
      {
        key: "vehicle",
        title: { bn: "গাড়ি ও মালামাল", en: "Vehicle & load" },
        fields: [
          {
            key: "passengers",
            type: "number",
            label: { bn: "যাত্রী সংখ্যা", en: "Passengers" },
            validation: { min: 1, max: 15 },
            showIf: vehicleIn("car", "cng", "van"),
          },
          {
            key: "acRequired",
            type: "boolean",
            label: { bn: "এসি গাড়ি লাগবে", en: "AC required" },
            showIf: vehicleIn("car", "van"),
          },
          {
            key: "carClass",
            type: "select",
            label: { bn: "গাড়ির মান", en: "Car class" },
            showIf: vehicleIn("car"),
            options: options([
              ["sedan", "সাধারণ সেডান", "Sedan"],
              ["premium", "প্রিমিয়াম", "Premium"],
              ["microbus", "মাইক্রোবাস (৭–১১ সিট)", "Microbus 7–11 seat"],
            ]),
          },
          {
            key: "goods",
            type: "textarea",
            label: { bn: "কী মালামাল নেবেন", en: "Goods" },
            placeholder: { bn: "যেমন: ২০ বস্তা চাল, একটি ফ্রিজ" },
            required: true,
            validation: { maxLength: 300 },
            showIf: vehicleIn("pickup", "truck"),
          },
          {
            key: "approxWeight",
            type: "select",
            label: { bn: "আনুমানিক ওজন", en: "Approx. weight" },
            showIf: vehicleIn("pickup", "truck"),
            options: options([
              ["lt_500kg", "৫০০ কেজির কম", "< 500 kg"],
              ["0.5_1t", "৫০০ কেজি – ১ টন", "0.5–1 t"],
              ["1_3t", "১–৩ টন", "1–3 t"],
              ["3_5t", "৩–৫ টন", "3–5 t"],
              ["gt_5t", "৫ টনের বেশি", "5 t+"],
            ]),
          },
          {
            key: "truckSize",
            type: "select",
            label: { bn: "ট্রাকের সাইজ", en: "Truck size" },
            showIf: vehicleIn("truck"),
            options: options([
              ["1t", "১ টন", "1 ton"],
              ["3t", "৩ টন", "3 ton"],
              ["5t", "৫ টন", "5 ton"],
              ["7.5t", "৭.৫ টন", "7.5 ton"],
              ["covered_van", "কাভার্ড ভ্যান", "Covered van"],
            ]),
          },
          {
            key: "needLabour",
            type: "boolean",
            label: { bn: "লেবার / শ্রমিক লাগবে", en: "Need labour" },
            showIf: vehicleIn("pickup", "truck"),
          },
          {
            key: "labourCount",
            type: "number",
            label: { bn: "কয়জন শ্রমিক", en: "Labour count" },
            validation: { min: 1, max: 20 },
            showIf: [vehicleIn("pickup", "truck"), { field: "needLabour", op: "truthy" }],
          },
        ],
      },
    ],
  },
});
