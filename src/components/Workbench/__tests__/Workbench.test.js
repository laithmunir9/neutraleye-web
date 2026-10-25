import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ── Next.js mocks ──────────────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next/link", () => {
  function MockNextLink({ children, ...props }) {
    return <a {...props}>{children}</a>;
  }

  MockNextLink.displayName = "MockNextLink";
  return MockNextLink;
});

jest.mock("next/image", () => {
  function MockNextImage(props) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  }

  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

// ── App mocks ──────────────────────────────────────────────────────────────────

let mockAuth = { user: null, loading: false };
jest.mock("@/lib/supabase/AuthProvider", () => ({
  useAuth: () => mockAuth,
}));

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

// jsdom does not implement modal dialogs; give it the minimum AuthDialog uses.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

jest.mock("@/lib/storage", () => ({
  saveAnalysis: jest.fn(),
  getAnalysis: jest.fn(() => null),
}));

const mockAnalyzeText = jest.fn();
const mockAnalyzeUrl = jest.fn();

jest.mock("@/lib/api", () => {
  const { ApiError } = jest.requireActual("@/lib/api");
  return {
    analyzeText: (...args) => mockAnalyzeText(...args),
    analyzeUrl: (...args) => mockAnalyzeUrl(...args),
    ApiError,
  };
});

// ── Import after mocks ─────────────────────────────────────────────────────────

const { ApiError } = require("@/lib/api");
import Workbench from "../Workbench";

function AnalyzePage() {
  return <Workbench />;
}

// ── Tests ───────────────────────────────────────────────────────────────────────

describe("Read mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders a complete biased article result", async () => {
    mockAnalyzeText.mockResolvedValue({
      id: "biased-1",
      createdAt: "2026-04-30T12:00:00.000Z",
      inputType: "text",
      direction: "Moderate framing signal",
      directionLabel: "Moderate framing signal",
      confidence: 0.75,
      summary: "The article uses repeated selective emphasis and loaded phrasing that push readers toward one interpretation.",
      drivers: ["Loaded wording", "Framing", "Source imbalance"],
      examples: [{ quote: "The policy was described as reckless and chaotic." }],
      sources: ["Associated Press"],
      recommendations: ["Compare with wire-service reporting."]
    });

    const user = userEvent.setup();
    render(<AnalyzePage />);

    const longText = [
      "This article describes a public policy debate with several named participants and a sequence of events.",
      "It includes enough sentence structure to look like article body text while still being short enough for the test.",
      "The content is only a fixture, but it should pass the frontend quality checks before the mocked request succeeds."
    ].join(" ");

    const textarea = screen.getByPlaceholderText("Paste a link or the article text");
    await user.click(textarea);
    await user.paste(longText);
    await user.click(screen.getByRole("button", { name: "Analyze framing" }));

    await waitFor(() => {
      expect(screen.getByText("Moderate framing signal")).toBeInTheDocument();
    });

    // The summary is a bare paragraph now, and the evidence is headed by its own
    // count rather than the word "Examples", so these assert on the content that
    // reaches the reader rather than on section headings that no longer exist.
    expect(screen.getByText(/repeated selective emphasis/i)).toBeInTheDocument();
    expect(screen.getByText("1 marked passage")).toBeInTheDocument();
    expect(screen.getByText(/reckless and chaotic/i)).toBeInTheDocument();
    // Secondary material is present but behind disclosure.
    expect(screen.getByText("Other coverage of this story")).toBeInTheDocument();
    expect(screen.getByText("Associated Press")).toBeInTheDocument();
    expect(screen.getByText("What to read next")).toBeInTheDocument();
    expect(screen.getByText("Compare with wire-service reporting.")).toBeInTheDocument();
    expect(screen.queryByText("Why nothing was flagged")).not.toBeInTheDocument();
  });

  test("renders a deliberate neutral result when no significant bias is detected", async () => {
    mockAnalyzeText.mockResolvedValue({
      id: "neutral-1",
      createdAt: "2026-04-30T12:00:00.000Z",
      inputType: "text",
      direction: "Neutral",
      directionLabel: "No significant bias detected",
      confidence: 0.64,
      summary: "",
      drivers: ["Loaded wording", "Framing", "Attribution"],
      examples: [],
      sources: [],
      recommendations: []
    });

    const user = userEvent.setup();
    render(<AnalyzePage />);

    const longText = [
      "This article describes a public policy debate with several named participants and a sequence of events.",
      "It includes enough sentence structure to look like article body text while still being short enough for the test.",
      "The content is only a fixture, but it should pass the frontend quality checks before the mocked request succeeds."
    ].join(" ");

    const textarea = screen.getByPlaceholderText("Paste a link or the article text");
    await user.click(textarea);
    await user.paste(longText);
    await user.click(screen.getByRole("button", { name: "Analyze framing" }));

    await waitFor(() => {
      expect(screen.getAllByText("No significant framing detected.").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Please feel free to continue reading.")).toBeInTheDocument();
    expect(screen.getByText(/stayed below the threshold for a meaningful framing flag/i)).toBeInTheDocument();
    expect(screen.getByText("Why nothing was flagged")).toBeInTheDocument();
    expect(screen.getByText(/visible signals stayed below the threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/no passage crossed the threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/no comparison sources were suggested/i)).toBeInTheDocument();
    expect(screen.getByText(/no follow-up steps were generated/i)).toBeInTheDocument();
  });

  test("an opinion piece with nothing flagged says it argues openly, not that it has no framing", async () => {
    mockAnalyzeText.mockResolvedValue({
      id: "opinion-1",
      createdAt: "2026-10-25T12:00:00.000Z",
      inputType: "text",
      contentType: "opinion",
      direction: "non-directional",
      directionLabel: "No significant framing detected",
      confidence: 0.9,
      summary: "",
      drivers: [],
      examples: [],
      sources: [],
      recommendations: [],
      requestMeta: { biasLevel: "none", contentType: "opinion" }
    });

    const user = userEvent.setup();
    render(<AnalyzePage />);
    const textarea = screen.getByPlaceholderText("Paste a link or the article text");
    await user.click(textarea);
    await user.paste([
      "This column argues that the city should scrap its new parking fees before they take effect in March.",
      "It sets out the case against the plan and answers the council's argument about congestion downtown.",
      "The content is only a fixture, but it should pass the frontend quality checks before the mocked request succeeds."
    ].join(" "));
    await user.click(screen.getByRole("button", { name: "Analyze framing" }));

    await waitFor(() => expect(screen.getAllByText("Opinion: argues its side openly.").length).toBeGreaterThan(0));
    expect(screen.queryByText("No significant framing detected.")).not.toBeInTheDocument();
    expect(screen.getByText("Taking a side is what opinion writing does.")).toBeInTheDocument();
    expect(screen.getByText(/read against the opinion standard/)).toBeInTheDocument();
    expect(screen.getByText(/so the stance itself is not flagged/)).toBeInTheDocument();
  });

  test("shows a readable validation error for repetitive text input", async () => {
    const user = userEvent.setup();
    render(<AnalyzePage />);

    const repetitiveText = `${"bias ".repeat(220)}This fragment is still repetitive and should not pass as a real article body.`;

    const textarea = screen.getByPlaceholderText("Paste a link or the article text");
    await user.click(textarea);
    await user.paste(repetitiveText);
    await user.click(screen.getByRole("button", { name: "Analyze framing" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not analyze this text");
    expect(alert).toHaveTextContent("Please paste a real article body and try again.");
    expect(alert).not.toHaveTextContent("ARTICLE_VALIDATION_FAILED");
    expect(alert).not.toHaveTextContent("Request ID");
    expect(mockAnalyzeText).not.toHaveBeenCalled();
  });

  test("displays a simple error title and message for NETWORK_ERROR", async () => {
    mockAnalyzeText.mockRejectedValue(
      new ApiError("Network error: could not reach analysis service.", {
        status: 0,
        code: "NETWORK_ERROR",
        requestId: "req-123",
        endpoint: "/analyze-text",
      })
    );

    const user = userEvent.setup();
    render(<AnalyzePage />);

    // Type enough text (>= 200 chars) to enable the Analyze button
    const longText = [
      "This article describes a public policy debate with several named participants and a sequence of events.",
      "It includes enough sentence structure to look like article body text while still being short enough for the test.",
      "The content is only a fixture, but it should pass the frontend quality checks before the mocked request fails."
    ].join(" ");
    const textarea = screen.getByPlaceholderText("Paste a link or the article text");
    await user.click(textarea);
    await user.paste(longText);

    const analyzeButton = screen.getByRole("button", { name: "Analyze framing" });
    expect(analyzeButton).toBeEnabled();
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Analysis unavailable");
    expect(alert).toHaveTextContent("Failed to analyze framing. Please try again later.");
    expect(alert).not.toHaveTextContent("NETWORK_ERROR");
    expect(alert).not.toHaveTextContent("NEXT_PUBLIC");
  });
});

describe("Mode toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  test("opens on Read, with Write present but hidden", () => {
    render(<Workbench />);

    expect(screen.getByRole("tab", { name: "Read" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByPlaceholderText("Paste a link or the article text")).toBeVisible();
    expect(screen.getByRole("button", { name: "Take me to dashboard", hidden: true })).not.toBeVisible();
  });

  test("selecting Write switches the slot and puts the mode in the URL", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Take me to dashboard" })).toBeVisible();
    expect(window.location.search).toBe("?mode=write");

    await user.click(screen.getByRole("tab", { name: "Read" }));
    expect(window.location.search).toBe("");
  });

  test("arrow keys move between modes", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    screen.getByRole("tab", { name: "Read" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Write" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute("aria-selected", "true");
  });

  test("text pasted in Read survives switching to Write and back", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByPlaceholderText("Paste a link or the article text"));
    await user.paste("Draft text that should still be here.");

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByRole("button", { name: "Take me to dashboard" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Read" }));
    expect(screen.getByPlaceholderText("Paste a link or the article text")).toHaveValue(
      "Draft text that should still be here."
    );
  });

  test("an unknown mode falls back to Read", () => {
    render(<Workbench initialMode="research" />);
    expect(screen.getByRole("tab", { name: "Read" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Write mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = { user: null, loading: false };
  });

  test("shows the prompt line and one button, nothing else", () => {
    render(<Workbench initialMode="write" />);
    const panel = document.getElementById("panel-write");
    expect(panel).toHaveTextContent("For the drafts you write yourself.");
    expect(screen.getByRole("button", { name: "Take me to dashboard" })).toBeVisible();
    // The sign-in dialog is mounted closed inside the panel; everything else counts.
    const outsideDialog = (selector) => [...panel.querySelectorAll(selector)].filter((el) => !el.closest("dialog"));
    expect(outsideDialog("input, textarea, form")).toHaveLength(0);
    expect(outsideDialog("button")).toHaveLength(1);
  });

  test("a signed-in reader goes straight to the dashboard", async () => {
    mockAuth = { user: { email: "reader@example.com" }, loading: false };
    const user = userEvent.setup();
    render(<Workbench initialMode="write" />);

    await user.click(screen.getByRole("button", { name: "Take me to dashboard" }));
    expect(mockPush).toHaveBeenCalledWith("/write");
  });

  test("a signed-out reader gets sign-in, worded for the dashboard", async () => {
    const user = userEvent.setup();
    render(<Workbench initialMode="write" />);

    await user.click(screen.getByRole("button", { name: "Take me to dashboard" }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByText("Sign in to open your writing dashboard.")).toBeVisible();
  });
});

describe("Read mode links", () => {
  const { detectUrl } = require("../ReadMode");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("treats a single address as a link and anything with spaces as text", () => {
    expect(detectUrl("https://example.com/news/story")?.href).toBe("https://example.com/news/story");
    expect(detectUrl("example.com/news/story")?.href).toBe("https://example.com/news/story");
    expect(detectUrl("  www.example.co.uk/a/b?x=1  ")?.hostname).toBe("www.example.co.uk");
    expect(detectUrl("The council voted on Tuesday.")).toBeNull();
    expect(detectUrl("hello")).toBeNull();
  });

  test("a pasted link is fetched, without the text minimum", async () => {
    mockAnalyzeUrl.mockResolvedValue({
      id: "url-1",
      inputType: "url",
      url: "https://example.com/news/story",
      directionLabel: "Moderate framing signal",
      direction: "Moderate framing signal",
      confidence: 0.7,
      summary: "Fetched and read.",
      drivers: ["Framing"],
      examples: [],
      sources: [],
      recommendations: []
    });
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByPlaceholderText("Paste a link or the article text"));
    await user.paste("example.com/news/story");
    expect(screen.getByText("Link to example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Analyze link" }));

    await waitFor(() => expect(screen.getByText("Moderate framing signal")).toBeInTheDocument());
    expect(mockAnalyzeUrl).toHaveBeenCalledWith("https://example.com/news/story");
    expect(mockAnalyzeText).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit link" })).toBeInTheDocument();
  });

  test("a site's front page is turned away before any request", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByPlaceholderText("Paste a link or the article text"));
    await user.paste("https://example.com");
    await user.click(screen.getByRole("button", { name: "Analyze link" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Link to the article itself");
    expect(mockAnalyzeUrl).not.toHaveBeenCalled();
  });

  test("an unreadable page suggests pasting the text instead", async () => {
    mockAnalyzeUrl.mockRejectedValue(
      new ApiError("Could not fetch", { status: 422, code: "URL_FETCH_FAILED", endpoint: "/api/analyze" })
    );
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByPlaceholderText("Paste a link or the article text"));
    await user.paste("https://example.com/paywalled/story");
    await user.click(screen.getByRole("button", { name: "Analyze link" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Could not read that page"));
    expect(screen.getByRole("alert")).toHaveTextContent("Paste the article text instead");
  });
});
