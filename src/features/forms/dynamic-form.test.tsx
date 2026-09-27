import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AreaGroup } from "@/features/account/queries";

import { DynamicForm } from "./components/dynamic-form";
import { getTemplate } from "./templates";
import type { FormSchema } from "./types";

vi.mock("@/features/media/components/image-uploader", () => ({
  ImageUploader: ({ label }: { label: string }) => <div>{label}</div>,
}));

const areaGroups: AreaGroup[] = [
  {
    id: "sadar",
    nameBn: "বগুড়া সদর",
    areas: [
      { id: "sadar", nameBn: "বগুড়া সদর — অন্য এলাকা" },
      { id: "satmatha", nameBn: "সাতমাথা" },
    ],
  },
  { id: "sherpur", nameBn: "শেরপুর", areas: [{ id: "sherpur", nameBn: "শেরপুর" }] },
];

const schema: FormSchema = {
  schemaVersion: 1,
  kind: "REQUEST",
  common: { address: "required" },
  sections: [
    {
      key: "job",
      title: { bn: "কাজের ধরন" },
      fields: [
        {
          key: "kind",
          type: "radio",
          label: { bn: "ধরন" },
          required: true,
          options: [
            { value: "repair", label: { bn: "মেরামত" } },
            { value: "new", label: { bn: "নতুন" } },
          ],
        },
        {
          key: "problem",
          type: "textarea",
          label: { bn: "সমস্যা" },
          required: true,
          showIf: { field: "kind", op: "eq", value: "repair" },
        },
      ],
    },
  ],
};

beforeEach(() => sessionStorage.clear());

async function fillContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/আপনার নাম/), "রহিম উদ্দিন");
  await user.type(screen.getByLabelText(/মোবাইল নম্বর/), "01712-345678");
  await user.selectOptions(screen.getByLabelText(/^এলাকা/), "sadar");
  await user.selectOptions(screen.getByLabelText("এলাকা"), "satmatha");
  await user.type(screen.getByLabelText(/বিস্তারিত ঠিকানা/), "বাসা ১২, সাতমাথা");
}

describe("DynamicForm", () => {
  it("blocks the step with Bangla errors and an error summary", async () => {
    const user = userEvent.setup();
    render(<DynamicForm schema={schema} areaGroups={areaGroups} onSubmit={vi.fn()} />);
    expect(screen.getByText("ধাপ ১/২")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /পরের ধাপ/ }));
    const summary = await screen.findByRole("alert");
    expect(within(summary).getByText("এগোনোর আগে এগুলো ঠিক করুন:")).toBeInTheDocument();
    expect(within(summary).getByRole("link", { name: "ধরন" })).toHaveAttribute(
      "href",
      "#f-details-kind",
    );
    expect(screen.getByText("ধাপ ১/২")).toBeInTheDocument();
  });

  it("shows a conditional field only when its controller matches", async () => {
    const user = userEvent.setup();
    render(<DynamicForm schema={schema} areaGroups={areaGroups} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/সমস্যা/)).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("মেরামত"));
    expect(screen.getByLabelText(/সমস্যা/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("নতুন"));
    expect(screen.queryByLabelText(/সমস্যা/)).not.toBeInTheDocument();
  });

  it("walks to the final step, shows the review and submits parsed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => ({ ok: true as const }));
    render(<DynamicForm schema={schema} areaGroups={areaGroups} onSubmit={onSubmit} />);
    await user.click(screen.getByLabelText("মেরামত"));
    await user.type(screen.getByLabelText(/সমস্যা/), "ফ্যান ঘুরছে না");
    await user.click(screen.getByRole("button", { name: /পরের ধাপ/ }));

    expect(await screen.findByText("ধাপ ২/২")).toBeInTheDocument();
    const review = screen.getByRole("region", { name: "আপনার দেওয়া তথ্য" });
    expect(within(review).getByText("ফ্যান ঘুরছে না")).toBeInTheDocument();

    await fillContact(user);
    await user.click(screen.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      common: {
        contactName: "রহিম উদ্দিন",
        contactPhone: "+8801712345678",
        areaId: "satmatha",
        addressLine: "বাসা ১২, সাতমাথা",
      },
      details: { kind: "repair", problem: "ফ্যান ঘুরছে না" },
    });
  });

  it("drops a hidden answer from the submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => ({ ok: true as const }));
    render(<DynamicForm schema={schema} areaGroups={areaGroups} onSubmit={onSubmit} />);
    await user.click(screen.getByLabelText("মেরামত"));
    await user.type(screen.getByLabelText(/সমস্যা/), "পুরনো উত্তর");
    await user.click(screen.getByLabelText("নতুন")); // problem is hidden now
    await user.click(screen.getByRole("button", { name: /পরের ধাপ/ }));
    await fillContact(user);
    await user.click(screen.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect((onSubmit.mock.calls[0] as unknown as [{ details: object }])[0].details).toEqual({
      kind: "new",
    });
  });

  it("item_list: adds and removes rows", async () => {
    const user = userEvent.setup();
    render(
      <DynamicForm
        schema={getTemplate("grocery_order")!.schema}
        areaGroups={areaGroups}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getAllByLabelText(/— নাম$/)).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /আরেকটি যোগ করুন/ }));
    await user.click(screen.getByRole("button", { name: /আরেকটি যোগ করুন/ }));
    expect(screen.getAllByLabelText(/— নাম$/)).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "পণ্য ২ সরান" }));
    expect(screen.getAllByLabelText(/— নাম$/)).toHaveLength(2);
  });

  it("restores a draft from sessionStorage and can start over", async () => {
    sessionStorage.setItem(
      "form-draft:test",
      JSON.stringify({
        values: { common: {}, details: { kind: "repair", problem: "খসড়া লেখা" } },
        step: 0,
      }),
    );
    const user = userEvent.setup();
    render(
      <DynamicForm schema={schema} areaGroups={areaGroups} draftKey="test" onSubmit={vi.fn()} />,
    );
    expect(await screen.findByText("আগের অসমাপ্ত ফর্মটি ফিরিয়ে আনা হয়েছে।")).toBeInTheDocument();
    expect(screen.getByLabelText(/সমস্যা/)).toHaveValue("খসড়া লেখা");
    await user.click(screen.getByRole("button", { name: "নতুন করে শুরু করুন" }));
    expect(screen.queryByLabelText(/সমস্যা/)).not.toBeInTheDocument();
  });

  it("shows server-side errors returned by onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => ({
      ok: false as const,
      error: "সার্ভারে সমস্যা",
      fieldErrors: { "common.contactPhone": "এই নম্বর ব্লক করা" },
    }));
    render(<DynamicForm schema={schema} areaGroups={areaGroups} onSubmit={onSubmit} />);
    await user.click(screen.getByLabelText("নতুন"));
    await user.click(screen.getByRole("button", { name: /পরের ধাপ/ }));
    await fillContact(user);
    await user.click(screen.getByRole("button", { name: "রিকোয়েস্ট পাঠান" }));
    expect(await screen.findByText("সার্ভারে সমস্যা")).toBeInTheDocument();
    expect(screen.getByText("এই নম্বর ব্লক করা")).toBeInTheDocument();
  });
});
