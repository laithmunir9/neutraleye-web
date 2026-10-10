import { render, screen, waitFor } from "@testing-library/react";
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
import { createClient } from "@/lib/supabase/client";

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

  test("clicking outside the panel does not close it; only the X does", async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteShell><p>Page content</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const dialog = container.querySelector("dialog");
    // A click on the <dialog> element itself is a click on the backdrop.
    await user.click(dialog);
    expect(dialog).toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
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

describe("Create account with an address that already has an account", () => {
  test("the confirmation screen tells an existing user to sign in, since no email is sent", async () => {
    // Supabase's decoy response for an already-confirmed address: a user with no identities, no error.
    createClient.mockReturnValue({
      auth: { signUp: jest.fn().mockResolvedValue({ data: { user: { id: "decoy", identities: [] } }, error: null }) },
    });
    const user = userEvent.setup();
    render(<SiteShell><p>Page</p></SiteShell>);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(screen.getByRole("button", { name: "No account? Create one" }));
    await user.type(screen.getByLabelText("Email"), "someone@example.com");
    await user.type(screen.getByLabelText("Password"), "a-long-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Check your email" })).toBeVisible());
    const copy = screen.getByText(/someone@example.com/).textContent;
    expect(copy).toMatch(/If you already have an account with this address, no email is sent: sign in instead/);
    expect(copy).toMatch(/check spam/);
    expect(screen.getByRole("button", { name: "Back to sign in" })).toBeVisible();
  });
});
