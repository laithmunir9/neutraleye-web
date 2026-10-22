import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/navigate", () => ({ navigateTo: jest.fn() }));
jest.mock("@/lib/googleNonce", () => ({
  createGoogleNonce: jest.fn().mockResolvedValue({ raw: "raw-nonce", hashed: "hashed-nonce" }),
}));

import AuthDialog from "../AuthDialog";
import { createClient } from "@/lib/supabase/client";
import { navigateTo } from "@/lib/navigate";

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

function mockAuth(overrides = {}) {
  const auth = {
    signInWithIdToken: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    ...overrides,
  };
  createClient.mockReturnValue({ auth });
  return auth;
}

// Google Identity Services, as the page sees it once its script has loaded.
let gsi;
beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState(null, "", "/privacy?x=1");
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  gsi = { initialize: jest.fn(), renderButton: jest.fn() };
  window.google = { accounts: { id: gsi } };
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  delete window.google;
});

describe("Continue with Google", () => {
  test("Google's button sits under the form when signing in and creating an account, not when resetting", async () => {
    const user = userEvent.setup();
    render(<AuthDialog open onClose={() => {}} />);

    expect(screen.getByRole("separator")).toHaveTextContent("or");
    await waitFor(() => expect(gsi.renderButton).toHaveBeenCalledTimes(1));
    expect(gsi.renderButton.mock.calls[0][1]).toMatchObject({ theme: "outline", text: "continue_with", locale: "en" });

    await user.click(screen.getByRole("button", { name: "No account? Create one" }));
    expect(screen.getByRole("separator")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Already have an account? Sign in" }));
    await user.click(screen.getByRole("button", { name: "Forgot your password?" }));
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  test("gives Google the client ID and the hashed nonce", async () => {
    render(<AuthDialog open onClose={() => {}} />);
    await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
    expect(gsi.initialize.mock.calls[0][0]).toMatchObject({
      client_id: "test-client.apps.googleusercontent.com",
      nonce: "hashed-nonce",
    });
  });

  test("trades Google's token for a Supabase session with the raw nonce, then lands on `next`", async () => {
    const auth = mockAuth();
    render(<AuthDialog open onClose={() => {}} next="/write" />);
    await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());

    await gsi.initialize.mock.calls[0][0].callback({ credential: "google-id-token" });
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith("/write"));
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({ provider: "google", token: "google-id-token", nonce: "raw-nonce" });
  });

  test("shows Supabase's error if the token is refused", async () => {
    mockAuth({ signInWithIdToken: jest.fn().mockResolvedValue({ data: {}, error: { message: "Nonces mismatch" } }) });
    const onClose = jest.fn();
    render(<AuthDialog open onClose={onClose} />);
    await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());

    await gsi.initialize.mock.calls[0][0].callback({ credential: "google-id-token" });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nonces mismatch"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("loads nothing from Google while the dialog is closed", () => {
    render(<AuthDialog open={false} onClose={() => {}} />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    expect(gsi.initialize).not.toHaveBeenCalled();
  });

  test("is left out entirely without a client ID", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    render(<AuthDialog open onClose={() => {}} />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  test("says so if Google's script cannot load", async () => {
    delete window.google;
    render(<AuthDialog open onClose={() => {}} />);
    const script = document.head.querySelector('script[src^="https://accounts.google.com/gsi/client"]');
    expect(script).not.toBeNull();
    script.dispatchEvent(new Event("error"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Google sign-in could not load"));
  });
});

describe("Opened on the way somewhere", () => {
  async function signIn(user) {
    await user.type(screen.getByLabelText("Email"), "reader@example.com");
    await user.type(screen.getByLabelText("Password"), "a-long-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
  }

  test("uses the caller's subtitle", () => {
    render(<AuthDialog open onClose={() => {}} subtitle="Sign in to open your writing dashboard." />);
    expect(screen.getByText("Sign in to open your writing dashboard.")).toBeVisible();
    expect(screen.queryByText(/Saves your reads/)).not.toBeInTheDocument();
  });

  test("a successful sign-in lands on `next`", async () => {
    mockAuth();
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<AuthDialog open onClose={onClose} next="/write" />);

    await signIn(user);
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith("/write"));
    expect(onClose).not.toHaveBeenCalled();
  });

  test("without `next`, sign-in only closes the dialog, as before", async () => {
    mockAuth();
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<AuthDialog open onClose={onClose} />);

    await signIn(user);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(navigateTo).not.toHaveBeenCalled();
    expect(screen.getByText(/Saves your reads/)).toBeInTheDocument();
  });
});
