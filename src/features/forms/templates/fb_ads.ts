import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const fbAds = digitalTemplate(
  { key: "fb_ads", name: "ফেসবুক অ্যাডস", description: "Facebook ads / boosting" },
  {
    key: "ads",
    title: { bn: "বিজ্ঞাপনের তথ্য", en: "Ad details" },
    fields: [
      {
        key: "objective",
        type: "radio",
        label: { bn: "বিজ্ঞাপনের উদ্দেশ্য", en: "Goal of the ads" },
        required: true,
        summary: true,
        options: options([
          ["messages", "বেশি মেসেজ", "More messages"],
          ["sales", "বিক্রি", "Sales"],
          ["leads", "লিড / যোগাযোগ", "Leads / enquiries"],
          ["page_likes", "পেজ লাইক / ফলোয়ার", "Page likes / followers"],
          ["awareness", "পরিচিতি বাড়ানো", "Brand awareness"],
        ]),
      },
      {
        key: "monthlyAdBudget",
        type: "money",
        label: { bn: "মাসিক বিজ্ঞাপন বাজেট (টাকা)", en: "Monthly ad budget (taka)" },
        help: {
          bn: "ফেসবুককে যে টাকা দেবেন — সার্ভিস চার্জ আলাদা।",
          en: "The amount you pay Facebook — our service charge is separate.",
        },
        required: true,
        validation: { min: 500 },
      },
      {
        key: "pageUrl",
        type: "url",
        label: { bn: "ফেসবুক পেজের লিংক", en: "Facebook page link" },
        required: true,
      },
    ],
  },
);
