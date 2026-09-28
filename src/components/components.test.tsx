import { renderWithI18n } from "@/test/i18n";
import { screen } from "@testing-library/react";

import { CallButton, WhatsAppButton } from "./contact-buttons";
import { PriceTag } from "./price-tag";
import { StatusBadge } from "./status-badge";

describe("PriceTag", () => {
  it("formats monthly rent in Bangla", () => {
    renderWithI18n(<PriceTag amount={8000} perMonth negotiable />);
    expect(screen.getByText("৳৮,০০০")).toBeInTheDocument();
    expect(screen.getByText("/মাস")).toBeInTheDocument();
    expect(screen.getByText("(আলোচনা সাপেক্ষে)")).toBeInTheDocument();
  });

  it("shows a starting price", () => {
    renderWithI18n(<PriceTag amount={500} from />);
    expect(screen.getByText("থেকে শুরু")).toBeInTheDocument();
  });

  it("handles a missing price", () => {
    renderWithI18n(<PriceTag amount={null} />);
    expect(screen.getByText("দাম আলোচনা সাপেক্ষে")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("labels request and listing statuses in Bangla", () => {
    renderWithI18n(
      <>
        <StatusBadge kind="request" status="PROCESSING" />
        <StatusBadge kind="listing" status="PENDING" />
      </>,
    );
    expect(screen.getByText("কাজ চলছে")).toBeInTheDocument();
    expect(screen.getByText("অনুমোদনের অপেক্ষায়")).toBeInTheDocument();
  });
});

describe("contact buttons", () => {
  it("render nothing while the number is not configured", () => {
    const { container } = renderWithI18n(
      <>
        <CallButton phone={null} label="কল" />
        <WhatsAppButton phone={null} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("link to tel: and wa.me", () => {
    renderWithI18n(
      <>
        <CallButton phone="01712345678" label="কল" />
        <WhatsAppButton phone="01712345678" text="হ্যালো" label="WA" />
      </>,
    );
    expect(screen.getByRole("link", { name: "কল" })).toHaveAttribute("href", "tel:+8801712345678");
    expect(screen.getByRole("link", { name: "WA" })).toHaveAttribute(
      "href",
      `https://wa.me/8801712345678?text=${encodeURIComponent("হ্যালো")}`,
    );
  });
});
