import { defineTemplate, options } from "./_helpers";

export const listingFurniture = defineTemplate({
  key: "listing_furniture",
  name: "ফার্নিচার (বিজ্ঞাপন)",
  kind: "LISTING",
  description: "Buy & Sell: furniture",
  schema: {
    schemaVersion: 1,
    kind: "LISTING",
    common: {},
    sections: [
      {
        key: "furniture",
        title: { bn: "ফার্নিচারের তথ্য", en: "Furniture" },
        fields: [
          {
            key: "furnitureType",
            type: "select",
            label: { bn: "ফার্নিচারের ধরন", en: "Furniture type" },
            required: true,
            summary: true,
            filterable: true,
            options: options([
              ["bed", "খাট / বেড", "Bed"],
              ["sofa", "সোফা", "Sofa"],
              ["table", "টেবিল", "Table"],
              ["almirah", "আলমারি", "Almirah"],
              ["chair", "চেয়ার", "Chair"],
              ["showcase", "শোকেস", "Showcase"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "material",
            type: "select",
            label: { bn: "উপকরণ", en: "Material" },
            width: "half",
            options: options([
              ["wood", "কাঠ", "Wood"],
              ["board", "বোর্ড", "Board"],
              ["steel", "স্টিল", "Steel"],
              ["other", "অন্যান্য", "Other"],
            ]),
          },
          {
            key: "quantity",
            type: "number",
            label: { bn: "পরিমাণ", en: "Quantity" },
            defaultValue: 1,
            validation: { min: 1, max: 100 },
            width: "half",
          },
        ],
      },
    ],
  },
});
