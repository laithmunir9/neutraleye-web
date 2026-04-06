import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ── Next.js mocks ──────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/analyze",
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
import AnalyzePage from "../page";

// ── Tests ───────────────────────────────────────────────────────────────────────

describe("AnalyzePage – NETWORK_ERROR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays correct error title, message, and suggestions for NETWORK_ERROR", async () => {
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
    const longText = "A".repeat(250);
    const textarea = screen.getByPlaceholderText("Paste article text for analysis...");
    await user.click(textarea);
    await user.paste(longText);

    const analyzeButton = screen.getByRole("button", { name: "Analyze" });
    expect(analyzeButton).toBeEnabled();
    await user.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const alert = screen.getByRole("alert");

    // Title
    expect(alert).toHaveTextContent("Service connection failed");
    // Message
    expect(alert).toHaveTextContent("NeutralEye could not reach the analysis backend.");
    // Suggestions
    expect(alert).toHaveTextContent("Confirm the website backend is running.");
    expect(alert).toHaveTextContent("Check NEXT_PUBLIC_NEUTRALEYE_API_URL and retry.");
  });
});
