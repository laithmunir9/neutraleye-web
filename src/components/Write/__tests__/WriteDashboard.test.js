import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ── A stand-in Supabase client that records every drafts call ──────────────

const mockCalls = [];
let mockRows = {};

function mockBuilder() {
  const op = { filters: {} };
  const chain = {
    insert(values) { op.kind = "insert"; op.values = values; return chain; },
    update(values) { op.kind = "update"; op.values = values; return chain; },
    select(columns) { if (!op.kind) op.kind = "select"; op.columns = columns; return chain; },
    eq(column, value) { op.filters[column] = value; return chain; },
    single() {
      mockCalls.push(op);
      if (op.kind === "insert") {
        return Promise.resolve({ data: { id: "new-1", word_count: 0, last_review: null, last_reviewed_at: null, created_at: "2026-10-23T10:00:00Z", updated_at: "2026-10-23T10:00:00Z", ...op.values }, error: null });
      }
      if (op.kind === "update") return Promise.resolve({ data: { updated_at: "2026-10-23T11:00:00Z" }, error: null });
      return Promise.resolve({ data: { content: mockRows[op.filters.id] ?? null }, error: null });
    },
  };
  return chain;
}

jest.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from: () => mockBuilder() }) }));
jest.mock("@/lib/supabase/AuthProvider", () => ({ useAuth: () => ({ user: { email: "w@x.com" }, loading: false }) }));
jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

import WriteDashboard from "../WriteDashboard";

const DRAFTS = [
  { id: "a", title: "Transit fare essay", kind: "essay", target: null, topic: null, word_count: 40, last_review: null, last_reviewed_at: null, created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-20T10:00:00Z" },
  { id: "b", title: "Library hours op-ed", kind: "opinion", target: "The Economist, news analysis", topic: "Library hours", word_count: 168, last_review: { findings: [1, 2, 3, 4] }, last_reviewed_at: "2026-10-12T10:00:00Z", created_at: "2026-10-02T10:00:00Z", updated_at: "2026-10-22T10:00:00Z" },
];

beforeEach(() => {
  mockCalls.length = 0;
  mockRows = { a: null, b: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Saved words." }] }] } };
});

describe("first visit", () => {
  test("opens the setup card, with nothing to cancel back to", () => {
    render(<WriteDashboard initialDrafts={[]} />);
    expect(screen.getByRole("heading", { name: "What are you setting out to write?" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByText("NeutralEye will hold your draft to this when you check it. It will not write in this voice for you.")).toBeVisible();
  });

  test("Start writing creates the draft and opens it", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={[]} />);

    await user.type(screen.getByLabelText("Title"), "Bus timetable");
    await user.click(within(screen.getByRole("group", { name: "What kind of piece" })).getByRole("button", { name: "News" }));
    await user.click(screen.getByRole("button", { name: "A wire reporter" }));
    expect(screen.getByLabelText("Who do you want to write like?")).toHaveValue("A wire reporter");
    await user.click(screen.getByRole("button", { name: "Start writing" }));

    await waitFor(() => expect(screen.getByLabelText("Draft title")).toHaveValue("Bus timetable"));
    expect(mockCalls[0]).toMatchObject({ kind: "insert", values: { title: "Bus timetable", kind: "news", target: "A wire reporter", topic: null } });
    // A new draft is known to be empty, so nothing is fetched for it.
    expect(mockCalls.filter((c) => c.kind === "select")).toHaveLength(0);
    const panel = screen.getByRole("complementary", { name: "Framing" });
    expect(within(panel).getByText("A wire reporter")).toBeVisible();
    expect(within(screen.getByRole("complementary", { name: "Drafts" })).getByText("News · Not checked yet")).toBeVisible();
  });

  test("an empty title becomes Untitled", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={[]} />);
    await user.click(screen.getByRole("button", { name: "Start writing" }));
    await waitFor(() => expect(mockCalls[0]?.values.title).toBe("Untitled"));
  });
});

describe("with drafts", () => {
  test("lists them newest first with their status, and opens the newest", async () => {
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    const rail = screen.getByRole("complementary", { name: "Drafts" });
    const rowsShown = within(rail).getAllByRole("button").filter((b) => b.textContent !== "New draft");
    expect(rowsShown.map((b) => b.textContent)).toEqual([
      "Library hours op-edOpinion · Checked Oct 12 · 4 notes",
      "Transit fare essayEssay · Not checked yet",
    ]);
    expect(rowsShown[0]).toHaveAttribute("aria-current", "true");
    expect(screen.getByLabelText("Draft title")).toHaveValue("Library hours op-ed");
    await waitFor(() => expect(mockCalls.find((c) => c.kind === "select")).toMatchObject({ columns: "content", filters: { id: "b" } }));
  });

  test("the panel shows the target and the kind's standard, and the check opens once the draft has loaded", async () => {
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    const panel = screen.getByRole("complementary", { name: "Framing" });
    expect(within(panel).getByText("The Economist, news analysis")).toBeVisible();
    expect(within(panel).getByRole("button", { name: "Opinion" })).toHaveAttribute("aria-pressed", "true");
    expect(within(panel).getByText(/^Opinion: taking a side is the point/)).toBeVisible();
    const check = within(panel).getByRole("button", { name: "Check framing" });
    expect(check).toBeDisabled();
    await waitFor(() => expect(check).toBeEnabled());
    expect(within(panel).getByText(/It will not rewrite anything. The fixing stays with you./)).toBeVisible();
  });

  describe("Check framing", () => {
    const REVIEW = {
      summary: "Arguing is what an opinion piece does.",
      findings: [{ quote: "Saved words", label: "needs_source", question: "What shows this?" }],
      target_notes: [{ note: "Pieces like this open with the news. Is that the choice you want?" }],
      kind: "opinion",
      target: "The Economist, news analysis",
    };

    beforeEach(() => {
      Element.prototype.scrollIntoView = jest.fn();
      // Edit draft refocuses the editor, and ProseMirror then measures the
      // caret to scroll to it; jsdom has no layout, so give it empty boxes.
      const box = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 };
      Range.prototype.getClientRects = () => [];
      Range.prototype.getBoundingClientRect = () => box;
      Element.prototype.getClientRects = () => [];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ review: REVIEW, last_reviewed_at: new Date().toISOString(), updated_at: "2026-10-23T12:00:00Z" }),
      });
    });

    afterEach(() => {
      delete global.fetch;
    });

    test("shows the review read-only, marks the passage, and Edit draft goes back", async () => {
      const user = userEvent.setup();
      render(<WriteDashboard initialDrafts={DRAFTS} />);
      const check = screen.getByRole("button", { name: "Check framing" });
      await waitFor(() => expect(check).toBeEnabled());
      await user.click(check);

      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Checked as Opinion"));
      expect(global.fetch).toHaveBeenCalledWith("/api/write/review", expect.objectContaining({ method: "POST", body: JSON.stringify({ draftId: "b" }) }));
      expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();
      expect(screen.getByRole("textbox", { name: "Draft" })).toHaveAttribute("contenteditable", "false");

      const panel = screen.getByRole("complementary", { name: "Framing" });
      expect(within(panel).getByText(REVIEW.summary)).toBeVisible();
      const card = within(panel).getByRole("button", { name: /Needs a source/ });
      expect(card).toHaveTextContent("“Saved words”");
      expect(card).toHaveTextContent("What shows this?");
      expect(within(panel).getByRole("heading", { name: "Against your target" })).toBeVisible();
      expect(within(panel).getByText(REVIEW.target_notes[0].note)).toBeVisible();
      expect(screen.getByText("Opinion · Checked today · 1 note")).toBeVisible();

      const mark = document.querySelector('[data-finding="1"]');
      expect(mark).toHaveTextContent("Saved words");
      await user.click(card);
      expect(card).toHaveAttribute("aria-pressed", "true");
      expect(mark.scrollIntoView).toHaveBeenCalled();

      await user.click(within(panel).getByRole("button", { name: "Edit draft" }));
      expect(screen.getByRole("status")).toHaveTextContent("Saved");
      expect(document.querySelector("[data-finding]")).toBeNull();
      expect(screen.getByRole("textbox", { name: "Draft" })).toHaveAttribute("contenteditable", "true");
      expect(screen.getByRole("button", { name: "Check framing" })).toBeVisible();
    });

    test("an error stays in the panel and the draft stays editable", async () => {
      global.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: "You've reached today's limit of 10 checks. Your limit resets tomorrow." }) });
      const user = userEvent.setup();
      render(<WriteDashboard initialDrafts={DRAFTS} />);
      const check = screen.getByRole("button", { name: "Check framing" });
      await waitFor(() => expect(check).toBeEnabled());
      await user.click(check);

      expect(await screen.findByRole("alert")).toHaveTextContent("today's limit of 10 checks");
      expect(screen.getByRole("textbox", { name: "Draft" })).toHaveAttribute("contenteditable", "true");
      expect(screen.getByRole("button", { name: "Check framing" })).toBeEnabled();
    });
  });

  test("changing the kind saves it and updates the standard and the rail", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    const panel = screen.getByRole("complementary", { name: "Framing" });
    await user.click(within(panel).getByRole("button", { name: "News" }));
    expect(within(panel).getByText(/^News: the reader expects the facts/)).toBeVisible();
    await waitFor(() => expect(mockCalls.find((c) => c.kind === "update")).toMatchObject({ values: { kind: "news" }, filters: { id: "b" } }));
    expect(screen.getByText("News · Checked Oct 12 · 4 notes")).toBeVisible();
  });

  test("Change reopens the setup card for this draft, and saving returns to it", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(screen.getByLabelText("Title")).toHaveValue("Library hours op-ed");
    expect(screen.getByLabelText("Who do you want to write like?")).toHaveValue("The Economist, news analysis");
    expect(screen.getByLabelText("Topic")).toHaveValue("Library hours");
    await user.click(screen.getByRole("button", { name: "An Atlantic feature" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "What are you setting out to write?" })).not.toBeInTheDocument());
    expect(mockCalls.find((c) => c.kind === "update")).toMatchObject({ values: { target: "An Atlantic feature", kind: "opinion" }, filters: { id: "b" } });
    expect(within(screen.getByRole("complementary", { name: "Framing" })).getByText("An Atlantic feature")).toBeVisible();
  });

  test("New draft can be cancelled back to the open draft", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    await user.click(screen.getByRole("button", { name: "New draft" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Draft title")).toHaveValue("Library hours op-ed");
    expect(mockCalls.filter((c) => c.kind === "insert")).toHaveLength(0);
  });

  test("the toggles hide and show the rail and the panel", async () => {
    const user = userEvent.setup();
    render(<WriteDashboard initialDrafts={DRAFTS} />);
    await user.click(screen.getByRole("button", { name: "Hide drafts" }));
    expect(screen.queryByRole("complementary", { name: "Drafts" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide framing panel" }));
    expect(screen.queryByRole("complementary", { name: "Framing" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show drafts" }));
    expect(screen.getByRole("complementary", { name: "Drafts" })).toBeVisible();
  });
});

test("a failed list load says so instead of opening setup", () => {
  render(<WriteDashboard initialDrafts={[]} loadError />);
  expect(screen.queryByRole("heading", { name: "What are you setting out to write?" })).not.toBeInTheDocument();
  expect(screen.getAllByText(/could not be loaded/).length).toBeGreaterThan(0);
});
