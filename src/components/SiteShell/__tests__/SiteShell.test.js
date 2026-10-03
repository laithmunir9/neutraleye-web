import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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

jest.mock("@/lib/supabase/AuthProvider", () => ({
  useAuth: () => ({ user: null, loading: false, supabase: null }),
}));

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

import SiteShell from "../SiteShell";

// jsdom does not implement modal dialogs; give it the minimum the component uses.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("Sign-in overlay", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("Sign in opens an overlay on the current page, not a new one", async () => {
    const user = userEvent.setup();
    render(<SiteShell><p>Page content</p></SiteShell>);

    const signIn = screen.getByRole("button", { name: "Sign in" });
    expect(signIn.tagName).toBe("BUTTON");
    await user.click(signIn);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByText("Page content")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  test("the X closes it, and there is no separate way-back link", async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteShell><p>Page content</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.queryByText(/back to neutraleye/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(container.querySelector("dialog")).not.toHaveAttribute("open");
  });

  test("arriving from an email link opens it with the notice, and closing clears the URL", async () => {
    window.history.replaceState(null, "", "/?auth=signin&notice=reset");
    const user = userEvent.setup();
    render(<SiteShell initialAuth={{ mode: "signin", notice: "reset" }}><p>Page</p></SiteShell>);

    expect(screen.getByRole("heading", { name: "Password updated" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(window.location.search).toBe("");
  });

  test("switches to creating an account inside the overlay", async () => {
    const user = userEvent.setup();
    render(<SiteShell><p>Page</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(screen.getByRole("button", { name: "No account? Create one" }));
    expect(screen.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });
});
