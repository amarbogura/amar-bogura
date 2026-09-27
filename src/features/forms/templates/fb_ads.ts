import { options } from "./_helpers";
import { digitalTemplate } from "./digital_service";

export const fbAds = digitalTemplate(
  { key: "fb_ads", name: "ফেসবুক অ্যাডস", description: "Facebook ads / boosting" },
  {
    key: "ads",
    title: { bn: "বিজ্ঞাপনের তথ্য", en: "Ads" },
    fields: [
      {
        key: "objective",
        type: "radio",
        label: { bn: "বিজ্ঞাপনের উদ্দেশ্য", en: "Objective" },
        required: true,
        summary: true,
        options: options([
          ["messages", "বেশি মেসেজ", "Messages"],
          ["sales", "বিক্রি", "Sales"],
          ["leads", "লিড / যোগাযোগ", "Leads"],
          ["page_likes", "পেজ লাইক / ফলোয়ার", "Page likes"],
          ["awareness", "পরিচিতি বাড়ানো", "Awareness"],
        ]),
      },
      {
        key: "monthlyAdBudget",
        type: "money",
        label: { bn: "মাসিক বিজ্ঞাপন বাজেট (টাকা)", en: "Monthly ad budget" },
        help: { bn: "ফেসবুককে যে টাকা দেবেন — সার্ভিস চার্জ আলাদা।" },
        required: true,
        validation: { min: 500 },
      },
      {
        key: "pageUrl",
        type: "url",
        label: { bn: "ফেসবুক পেজের লিংক", en: "Page URL" },
        required: true,
      },
    ],
  },
);
