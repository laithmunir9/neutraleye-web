import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ── Next.js mocks ──────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
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

    const textarea = screen.getByPlaceholderText("Paste the article text here");
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

    const textarea = screen.getByPlaceholderText("Paste the article text here");
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

  test("shows a readable validation error for repetitive text input", async () => {
    const user = userEvent.setup();
    render(<AnalyzePage />);

    const repetitiveText = `${"bias ".repeat(220)}This fragment is still repetitive and should not pass as a real article body.`;

    const textarea = screen.getByPlaceholderText("Paste the article text here");
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
    const textarea = screen.getByPlaceholderText("Paste the article text here");
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
    expect(screen.getByPlaceholderText("Paste the article text here")).toBeVisible();
    expect(screen.queryByText("It will not write for you.")).not.toBeVisible();
  });

  test("selecting Write switches the slot and puts the mode in the URL", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByRole("tab", { name: "Write" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("It will not write for you.")).toBeVisible();
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

    await user.click(screen.getByPlaceholderText("Paste the article text here"));
    await user.paste("Draft text that should still be here.");

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByText("It will not write for you.")).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Read" }));
    expect(screen.getByPlaceholderText("Paste the article text here")).toHaveValue(
      "Draft text that should still be here."
    );
  });

  test("an unknown mode falls back to Read", () => {
    render(<Workbench initialMode="research" />);
    expect(screen.getByRole("tab", { name: "Read" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Write mode early access", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  test("leads with the promise not to draft", () => {
    render(<Workbench initialMode="write" />);
    expect(screen.getByRole("heading", { name: "It will not write for you." })).toBeVisible();
  });

  test("rejects a malformed address without calling the API", async () => {
    global.fetch = jest.fn();
    const user = userEvent.setup();
    render(<Workbench initialMode="write" />);

    await user.type(screen.getByLabelText(/write is not open yet/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Get early access" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter an email address");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("posts the address tagged as a Write signup", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const user = userEvent.setup();
    render(<Workbench initialMode="write" />);

    await user.type(screen.getByLabelText(/write is not open yet/i), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "Get early access" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("We will email reader@example.com");
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/waitlist",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com", source: "write" }),
      })
    );
  });
});
