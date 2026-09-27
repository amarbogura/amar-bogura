import { defineTemplate, options } from "./_helpers";

export const homeShifting = defineTemplate({
  key: "home_shifting",
  name: "বাসা / অফিস শিফটিং",
  kind: "REQUEST",
  description: "Home / office shifting",
  schema: {
    schemaVersion: 1,
    kind: "REQUEST",
    common: {
      address: "hidden",
      preferredDate: "required",
      preferredTimeSlot: "optional",
      notes: "optional",
      photos: "optional",
      altPhone: "optional",
    },
    sections: [
      {
        key: "move",
        title: { bn: "কী শিফট করবেন", en: "What are you moving" },
        fields: [
          {
            key: "shiftType",
            type: "radio",
            label: { bn: "শিফটিংয়ের ধরন", en: "Shifting type" },
            required: true,
            summary: true,
            options: options([
              ["home", "বাসা", "Home"],
              ["office", "অফিস", "Office"],
            ]),
          },
          {
            key: "size",
            type: "select",
            label: { bn: "আকার", en: "Size" },
            required: true,
            summary: true,
            options: options([
              ["room_1", "১ রুম", "1 room"],
              ["room_2", "২ রুম", "2 rooms"],
              ["room_3", "৩ রুম", "3 rooms"],
              ["room_4_plus", "৪ বা তার বেশি রুম", "4+ rooms"],
              ["office_small", "ছোট অফিস", "Small office"],
              ["office_medium", "মাঝারি অফিস", "Medium office"],
              ["office_large", "বড় অফিস", "Large office"],
            ]),
          },
          {
            key: "majorItems",
            type: "checkboxes",
            label: { bn: "বড় মালামাল কী কী আছে", en: "Major items" },
            options: options([
              ["fridge", "ফ্রিজ", "Fridge"],
              ["ac", "এসি", "AC"],
              ["bed", "খাট / বেড", "Bed / khat"],
              ["almirah", "আলমারি", "Almirah"],
              ["sofa", "সোফা", "Sofa"],
              ["dining_table", "ডাইনিং টেবিল", "Dining table"],
              ["tv", "টিভি", "TV"],
              ["washing_machine", "ওয়াশিং মেশিন", "Washing machine"],
              ["computer", "কম্পিউটার সেট", "Computer set"],
            ]),
          },
        ],
      },
      {
        key: "route",
        title: { bn: "কোথা থেকে কোথায়", en: "From / to" },
        fields: [
          {
            key: "route",
            type: "route",
            label: { bn: "পুরাতন ঠিকানা থেকে নতুন ঠিকানা", en: "Route" },
            required: true,
          },
          {
            key: "fromFloor",
            type: "number",
            label: { bn: "পুরাতন বাসার তলা", en: "From floor" },
            validation: { min: 0, max: 30 },
            width: "half",
          },
          {
            key: "fromLift",
            type: "boolean",
            label: { bn: "পুরাতন বাসায় লিফট আছে", en: "Lift at origin" },
            width: "half",
          },
          {
            key: "toFloor",
            type: "number",
            label: { bn: "নতুন বাসার তলা", en: "To floor" },
            validation: { min: 0, max: 30 },
            width: "half",
          },
          {
            key: "toLift",
            type: "boolean",
            label: { bn: "নতুন বাসায় লিফট আছে", en: "Lift at destination" },
            width: "half",
          },
        ],
      },
      {
        key: "extras",
        title: { bn: "অতিরিক্ত সেবা", en: "Extras" },
        fields: [
          {
            key: "needPacking",
            type: "boolean",
            label: { bn: "প্যাকিং করে দিতে হবে", en: "Need packing" },
          },
          {
            key: "needAcUninstall",
            type: "boolean",
            label: { bn: "এসি খুলে আবার লাগাতে হবে", en: "AC uninstall / reinstall" },
            showIf: { field: "majorItems", op: "in", value: ["ac"] },
          },
          {
            key: "vehiclePref",
            type: "radio",
            label: { bn: "গাড়ির পছন্দ", en: "Vehicle preference" },
            options: options([
              ["pickup", "পিকআপ", "Pickup"],
              ["truck", "ট্রাক", "Truck"],
              ["decide", "আপনারাই ঠিক করুন", "Let us decide"],
            ]),
          },
          {
            key: "siteVisit",
            type: "boolean",
            label: { bn: "আগে পরিদর্শন করে দাম জানাতে চাই", en: "Site visit before quote" },
          },
        ],
      },
    ],
  },
});
